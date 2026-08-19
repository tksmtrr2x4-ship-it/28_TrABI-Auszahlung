import mongoose from "mongoose";

const GesellschafterSchema = new mongoose.Schema({
  vorname: { type: String, required: true, trim: true },
  nachname: { type: String, required: true, trim: true },
  // Anteil am Gesamtvermögen in Prozent, z.B. 1.57 für 1,57 %
  anteilProzent: { type: Number, required: true },
  // Auszahlungsbetrag in Euro laut Verteilungsschlüssel
  betrag: { type: Number, required: true },
  status: { type: String, default: "Aktiv" },
});

GesellschafterSchema.index({ nachname: 1, vorname: 1 });

export default mongoose.models.Gesellschafter ||
  mongoose.model("Gesellschafter", GesellschafterSchema);
