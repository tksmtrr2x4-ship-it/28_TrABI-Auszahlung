import mongoose from "mongoose";

// Singleton-Dokument (schluessel: "global") für Werte, die sich über die
// Laufzeit ändern können – aktuell: das Gesamtvermögen der Stufenkasse.
// Getrennt von Gesellschafter, weil der Anteil (%) pro Person verbindlich
// feststeht, der daraus resultierende Euro-Betrag aber vorläufig ist,
// solange die Kasse noch belastet wird.
const EinstellungenSchema = new mongoose.Schema({
  schluessel: { type: String, required: true, unique: true, default: "global" },
  gesamtvermoegenEuro: { type: Number, required: true },
  // Erläuterungstext für die finale Abschluss-Mail/PDF (z.B. Begründung für
  // einen geringeren Betrag als ursprünglich in Aussicht gestellt).
  abschlussText: { type: String, default: "" },
  // Für den SEPA-Sammelüberweisungs-Export: das Konto, von dem tatsächlich
  // überwiesen wird (nicht mit den IBANs der Empfänger:innen verwechseln,
  // die liegen pro Antwort in models/Antwort.js).
  sepaKontoinhaber: { type: String, default: "" },
  sepaIban: { type: String, default: "" },
  sepaBic: { type: String, default: "" },
  aktualisiertAm: { type: Date, default: Date.now },
});

export default mongoose.models.Einstellungen ||
  mongoose.model("Einstellungen", EinstellungenSchema);
