import mongoose from "mongoose";

const AntwortSchema = new mongoose.Schema({
  gesellschafter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Gesellschafter",
    required: true,
    unique: true,
  },
  // Schnappschuss zum Zeitpunkt der Antwort (bleibt stabil, auch falls sich
  // die Gesellschafterliste später ändert).
  vorname: { type: String, required: true },
  nachname: { type: String, required: true },
  anteilProzent: { type: Number, required: true },
  betrag: { type: Number, required: true },

  moechteAuszahlung: { type: Boolean, required: true },
  iban: { type: String, default: null },
  email: { type: String, default: null },

  // Manuell im Admin gesetzt (z.B. nachträgliche Rückmeldung per E-Mail):
  // Person möchte ihren Betrag stattdessen spenden. Wirkt sich auf den
  // SEPA-Export (Empfänger = Spendenkonto statt eigener IBAN) und die
  // Abschluss-Mail aus.
  spendet: { type: Boolean, default: false },
  bearbeitetAm: { type: Date, default: null },
  bearbeitungsHinweis: { type: String, default: null },

  // Nachweis der AGB-Zustimmung (Stand § in lib/agb.js), damit im Streitfall
  // nachvollziehbar ist, wer wann welche Fassung akzeptiert hat.
  agbAkzeptiertAm: { type: Date, default: null },
  agbVersion: { type: String, default: null },

  emailStatus: {
    type: String,
    enum: ["gesendet", "fehler", "uebersprungen", "nicht_erforderlich"],
    default: "nicht_erforderlich",
  },

  // Finale Abschluss-Mail inkl. PDF (nach Fristablauf, endgültiger Betrag).
  // Getrennt von emailStatus (das ist die vorläufige Bestätigung direkt
  // nach dem Ausfüllen des Formulars).
  abschlussStatus: {
    type: String,
    enum: ["gesendet", "fehler", "uebersprungen", null],
    default: null,
  },
  abschlussVersandAm: { type: Date, default: null },
  abschlussBetrag: { type: Number, default: null },

  erstelltAm: { type: Date, default: Date.now },
  aktualisiertAm: { type: Date, default: Date.now },
});

export default mongoose.models.Antwort ||
  mongoose.model("Antwort", AntwortSchema);
