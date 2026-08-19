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

  // Nachweis der AGB-Zustimmung (Stand § in lib/agb.js), damit im Streitfall
  // nachvollziehbar ist, wer wann welche Fassung akzeptiert hat.
  agbAkzeptiertAm: { type: Date, default: null },
  agbVersion: { type: String, default: null },

  emailStatus: {
    type: String,
    enum: ["gesendet", "fehler", "uebersprungen", "nicht_erforderlich"],
    default: "nicht_erforderlich",
  },

  erstelltAm: { type: Date, default: Date.now },
  aktualisiertAm: { type: Date, default: Date.now },
});

export default mongoose.models.Antwort ||
  mongoose.model("Antwort", AntwortSchema);
