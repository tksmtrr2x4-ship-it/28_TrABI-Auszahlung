import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Gesellschafter from "@/models/Gesellschafter";
import Antwort from "@/models/Antwort";
import { isAdmin, forbiddenResponse } from "@/lib/auth";
import { isValidIban, normalizeIban } from "@/lib/iban";
import { formularPhase, formatDeadline, FORM_OPEN, FORM_CLOSE } from "@/lib/config";
import { sendAuszahlungsBestaetigung } from "@/lib/mail";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Admin: vollständige Übersicht aller Gesellschafter:innen inkl. Antwortstatus.
export async function GET(request) {
  if (!isAdmin(request)) return forbiddenResponse();

  await connectToDatabase();
  const [gesellschafter, antworten] = await Promise.all([
    Gesellschafter.find({}).sort({ nachname: 1, vorname: 1 }).lean(),
    Antwort.find({}).lean(),
  ]);

  const antwortByGesellschafter = new Map(
    antworten.map((a) => [a.gesellschafter.toString(), a])
  );

  const zeilen = gesellschafter.map((g) => {
    const antwort = antwortByGesellschafter.get(g._id.toString()) || null;
    return {
      id: g._id.toString(),
      vorname: g.vorname,
      nachname: g.nachname,
      anteilProzent: g.anteilProzent,
      betrag: g.betrag,
      status: g.status,
      geantwortet: Boolean(antwort),
      moechteAuszahlung: antwort?.moechteAuszahlung ?? null,
      iban: antwort?.iban ?? null,
      email: antwort?.email ?? null,
      emailStatus: antwort?.emailStatus ?? null,
      erstelltAm: antwort?.erstelltAm ?? null,
      aktualisiertAm: antwort?.aktualisiertAm ?? null,
    };
  });

  return Response.json(zeilen);
}

// Öffentlich: Formular-Einreichung (auch als Korrektur einer vorherigen Antwort).
export async function POST(request) {
  const phase = formularPhase();
  if (phase === "vor") {
    return Response.json(
      { error: `Die Umfrage ist noch nicht geöffnet. Start: ${formatDeadline(FORM_OPEN)}.` },
      { status: 403 }
    );
  }
  if (phase === "nach") {
    return Response.json(
      { error: `Die Frist ist abgelaufen (${formatDeadline(FORM_CLOSE)}).` },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const gesellschafterId = String(body.gesellschafterId || "");
  const moechteAuszahlung = body.moechteAuszahlung === true;

  if (!mongoose.isValidObjectId(gesellschafterId)) {
    return Response.json({ error: "Bitte wähle deinen Namen aus der Liste aus." }, { status: 400 });
  }

  await connectToDatabase();
  const gesellschafter = await Gesellschafter.findOne({
    _id: gesellschafterId,
    status: "Aktiv",
  }).lean();

  if (!gesellschafter) {
    return Response.json(
      { error: "Dieser Name konnte nicht zugeordnet werden. Bitte wende dich an die Stufenkasse." },
      { status: 404 }
    );
  }

  let iban = null;
  let email = null;

  if (moechteAuszahlung) {
    iban = normalizeIban(body.iban);
    email = String(body.email || "").trim();

    if (!isValidIban(iban)) {
      return Response.json(
        { error: "Die eingegebene IBAN ist ungültig. Bitte prüfe deine Eingabe." },
        { status: 400 }
      );
    }
    if (!EMAIL_REGEX.test(email)) {
      return Response.json(
        { error: "Bitte eine gültige E-Mail-Adresse angeben." },
        { status: 400 }
      );
    }
  }

  const jetzt = new Date();
  const update = {
    vorname: gesellschafter.vorname,
    nachname: gesellschafter.nachname,
    anteilProzent: gesellschafter.anteilProzent,
    betrag: gesellschafter.betrag,
    moechteAuszahlung,
    iban,
    email,
    aktualisiertAm: jetzt,
    emailStatus: "nicht_erforderlich",
  };

  const antwort = await Antwort.findOneAndUpdate(
    { gesellschafter: gesellschafter._id },
    { $set: update, $setOnInsert: { erstelltAm: jetzt } },
    { upsert: true, returnDocument: "after" }
  );

  let emailHinweis = null;

  if (moechteAuszahlung) {
    try {
      const ergebnis = await sendAuszahlungsBestaetigung({
        to: email,
        vorname: gesellschafter.vorname,
        nachname: gesellschafter.nachname,
        anteilProzent: gesellschafter.anteilProzent,
        betrag: gesellschafter.betrag,
        iban,
      });
      antwort.emailStatus = ergebnis.skipped ? "uebersprungen" : "gesendet";
    } catch (err) {
      console.error("E-Mail-Versand fehlgeschlagen:", err);
      antwort.emailStatus = "fehler";
      emailHinweis =
        "Deine Antwort wurde gespeichert, die Bestätigungs-E-Mail konnte aber nicht versendet werden. Bitte meldet euch bei uns.";
    }
    await antwort.save();
  }

  return Response.json({ ok: true, emailStatus: antwort.emailStatus, emailHinweis });
}
