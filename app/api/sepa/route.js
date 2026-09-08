import { connectToDatabase } from "@/lib/mongodb";
import Antwort from "@/models/Antwort";
import { isAdmin, forbiddenResponse } from "@/lib/auth";
import { getGesamtvermoegen, getSepaEinstellungen, setSepaEinstellungen } from "@/lib/einstellungen";
import { buildSepaXml, sepaSanitize } from "@/lib/sepa";
import { isValidIban } from "@/lib/iban";

// Admin: gespeicherte Kontodaten + Vorschau der Zahlungen (Empfänger:innen
// mit gültiger IBAN, die "Ja" gesagt haben).
export async function GET(request) {
  if (!isAdmin(request)) return forbiddenResponse();
  await connectToDatabase();

  const [sepaEinstellungen, gesamtvermoegenEuro, antworten] = await Promise.all([
    getSepaEinstellungen(),
    getGesamtvermoegen(),
    Antwort.find({ moechteAuszahlung: true }).sort({ nachname: 1, vorname: 1 }).lean(),
  ]);

  const zahlungen = antworten
    .filter((a) => isValidIban(a.iban))
    .map((a) => ({
      name: `${a.vorname} ${a.nachname}`,
      iban: a.iban,
      betrag: (a.anteilProzent / 100) * gesamtvermoegenEuro,
    }));

  const ohneGueltigeIban = antworten.filter((a) => !isValidIban(a.iban)).length;

  return Response.json({ ...sepaEinstellungen, zahlungen, ohneGueltigeIban });
}

// Admin: speichert die Kontodaten und liefert die fertige SEPA-XML-Datei
// zum Download.
export async function POST(request) {
  if (!isAdmin(request)) return forbiddenResponse();

  const body = await request.json().catch(() => ({}));
  const sepaKontoinhaber = String(body.sepaKontoinhaber || "").trim();
  const sepaIban = String(body.sepaIban || "").trim();
  const sepaBic = String(body.sepaBic || "").trim();
  const executionDate = String(body.executionDate || "").trim();
  const verwendungszweckVorlage = String(
    body.verwendungszweckVorlage || "Stufenkasse TrABI 2026"
  ).trim();

  if (!sepaKontoinhaber || !sepaIban) {
    return Response.json(
      { error: "Bitte Kontoinhaber und IBAN des Absenderkontos angeben." },
      { status: 400 }
    );
  }
  if (!isValidIban(sepaIban)) {
    return Response.json({ error: "Die IBAN des Absenderkontos ist ungültig." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(executionDate)) {
    return Response.json({ error: "Bitte ein gültiges Ausführungsdatum angeben." }, { status: 400 });
  }

  await connectToDatabase();
  await setSepaEinstellungen({ sepaKontoinhaber, sepaIban, sepaBic });

  const gesamtvermoegenEuro = await getGesamtvermoegen();
  const antworten = await Antwort.find({ moechteAuszahlung: true }).sort({
    nachname: 1,
    vorname: 1,
  });

  const zahlungen = antworten
    .filter((a) => isValidIban(a.iban))
    .map((a) => ({
      name: `${a.vorname} ${a.nachname}`,
      iban: a.iban,
      betrag: (a.anteilProzent / 100) * gesamtvermoegenEuro,
      verwendungszweck: `${verwendungszweckVorlage} - ${a.vorname} ${a.nachname}`,
    }));

  if (zahlungen.length === 0) {
    return Response.json(
      { error: "Keine Zahlungen mit gültiger IBAN gefunden." },
      { status: 400 }
    );
  }

  const msgId = `TRABI-${new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15)}`;
  const xml = buildSepaXml({
    msgId,
    debtorName: sepaKontoinhaber,
    debtorIban: sepaIban,
    debtorBic: sepaBic || null,
    executionDate,
    zahlungen,
  });

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${sepaSanitize(msgId)}.xml"`,
    },
  });
}
