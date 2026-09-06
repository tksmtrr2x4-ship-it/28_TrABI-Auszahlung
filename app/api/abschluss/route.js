import { connectToDatabase } from "@/lib/mongodb";
import Gesellschafter from "@/models/Gesellschafter";
import Antwort from "@/models/Antwort";
import { isAdmin, forbiddenResponse } from "@/lib/auth";
import { getGesamtvermoegen, getAbschlussText, setAbschlussText } from "@/lib/einstellungen";
import { buildAbschlussPdf } from "@/lib/pdf";
import { sendAbschlussMail } from "@/lib/mail";

// Admin: aktueller Erläuterungstext + Liste der Empfänger:innen (alle, die
// "Ja" gesagt haben) mit Abschluss-Versandstatus.
export async function GET(request) {
  if (!isAdmin(request)) return forbiddenResponse();
  await connectToDatabase();

  const [abschlussText, gesamtvermoegenEuro, antworten] = await Promise.all([
    getAbschlussText(),
    getGesamtvermoegen(),
    Antwort.find({ moechteAuszahlung: true }).sort({ nachname: 1, vorname: 1 }).lean(),
  ]);

  const empfaenger = antworten.map((a) => ({
    id: a._id.toString(),
    vorname: a.vorname,
    nachname: a.nachname,
    email: a.email,
    anteilProzent: a.anteilProzent,
    betrag: (a.anteilProzent / 100) * gesamtvermoegenEuro,
    abschlussStatus: a.abschlussStatus,
    abschlussVersandAm: a.abschlussVersandAm,
  }));

  return Response.json({ abschlussText, gesamtvermoegenEuro, empfaenger });
}

// Admin: löst den Versand der finalen Abschluss-Mail (inkl. PDF) aus.
// - testEmailAn gesetzt: schickt nur EIN Beispiel-PDF an diese Adresse,
//   ohne irgendwelche Antworten als "gesendet" zu markieren.
// - sonst: verschickt an alle Ja-Antworten, die noch nicht "gesendet" sind
//   (oder an alle erneut, falls alleErneut=true).
export async function POST(request) {
  if (!isAdmin(request)) return forbiddenResponse();

  const body = await request.json().catch(() => ({}));
  const abschlussText = String(body.abschlussText || "");
  const testEmailAn = body.testEmailAn ? String(body.testEmailAn).trim() : null;
  const alleErneut = body.alleErneut === true;

  await connectToDatabase();
  await setAbschlussText(abschlussText);
  const gesamtvermoegenEuro = await getGesamtvermoegen();

  if (testEmailAn) {
    const pdfBuffer = await buildAbschlussPdf({
      vorname: "Max",
      nachname: "Mustermann",
      anteilProzent: 3.34,
      betrag: (3.34 / 100) * gesamtvermoegenEuro,
      erklaerungText: abschlussText,
      engagementFaktor: 3,
    });
    try {
      await sendAbschlussMail({
        to: testEmailAn,
        vorname: "Max",
        nachname: "Mustermann (Test)",
        anteilProzent: 3.34,
        betrag: (3.34 / 100) * gesamtvermoegenEuro,
        erklaerungText: abschlussText,
        pdfBuffer,
      });
      return Response.json({ ok: true, test: true });
    } catch (err) {
      console.error("Test-Mail fehlgeschlagen:", err);
      return Response.json({ error: "Test-Mail konnte nicht gesendet werden." }, { status: 502 });
    }
  }

  const filter = alleErneut
    ? { moechteAuszahlung: true }
    : { moechteAuszahlung: true, abschlussStatus: { $ne: "gesendet" } };
  const empfaenger = await Antwort.find(filter);

  const gesellschafterListe = await Gesellschafter.find(
    { _id: { $in: empfaenger.map((a) => a.gesellschafter) } },
    { engagementFaktor: 1 }
  ).lean();
  const engagementByGesellschafter = new Map(
    gesellschafterListe.map((g) => [g._id.toString(), g.engagementFaktor])
  );

  let gesendet = 0;
  const fehler = [];

  for (const antwort of empfaenger) {
    const betrag = (antwort.anteilProzent / 100) * gesamtvermoegenEuro;
    const engagementFaktor = engagementByGesellschafter.get(antwort.gesellschafter.toString()) ?? null;
    try {
      const pdfBuffer = await buildAbschlussPdf({
        vorname: antwort.vorname,
        nachname: antwort.nachname,
        anteilProzent: antwort.anteilProzent,
        betrag,
        erklaerungText: abschlussText,
        engagementFaktor,
      });
      const ergebnis = await sendAbschlussMail({
        to: antwort.email,
        vorname: antwort.vorname,
        nachname: antwort.nachname,
        anteilProzent: antwort.anteilProzent,
        betrag,
        erklaerungText: abschlussText,
        pdfBuffer,
      });
      antwort.abschlussStatus = ergebnis.skipped ? "uebersprungen" : "gesendet";
      antwort.abschlussVersandAm = new Date();
      antwort.abschlussBetrag = betrag;
      await antwort.save();
      gesendet += 1;
    } catch (err) {
      console.error(`Abschluss-Mail an ${antwort.nachname} fehlgeschlagen:`, err);
      antwort.abschlussStatus = "fehler";
      await antwort.save();
      fehler.push(`${antwort.vorname} ${antwort.nachname}`);
    }
  }

  return Response.json({ ok: true, gesendet, fehler });
}
