// Liest den Verteilungsschlüssel (Blatt "Gesellschafterliste") aus der
// Excel-Datei und schreibt die aktiven Gesellschafter:innen in die
// Datenbank. Wird lokal ausgeführt, bevor das System live geht.
//
// Aufruf: npm run seed
// Benötigt in .env.local: SEED_XLSX_PATH, MONGODB_URI
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";
import { parseVerteilungsschluessel, parseGesamtvermoegen } from "./parseVerteilungsschluessel.mjs";

// Schemas hier bewusst dupliziert (statt models/*.js zu importieren): das
// Skript läuft als reines Node-ESM-Skript außerhalb von Next.js, ein
// Cross-Import würde CommonJS/ESM-Probleme verursachen.
const GesellschafterSchema = new mongoose.Schema({
  vorname: { type: String, required: true, trim: true },
  nachname: { type: String, required: true, trim: true },
  anteilProzent: { type: Number, required: true },
  betrag: { type: Number, required: true },
  status: { type: String, default: "Aktiv" },
});
const Gesellschafter =
  mongoose.models.Gesellschafter || mongoose.model("Gesellschafter", GesellschafterSchema);

const EinstellungenSchema = new mongoose.Schema({
  schluessel: { type: String, required: true, unique: true, default: "global" },
  gesamtvermoegenEuro: { type: Number, required: true },
  aktualisiertAm: { type: Date, default: Date.now },
});
const Einstellungen =
  mongoose.models.Einstellungen || mongoose.model("Einstellungen", EinstellungenSchema);

async function main() {
  const xlsxPath = process.env.SEED_XLSX_PATH;
  const mongoUri = process.env.MONGODB_URI;

  if (!xlsxPath) throw new Error("SEED_XLSX_PATH fehlt in .env.local.");
  if (!mongoUri) throw new Error("MONGODB_URI fehlt in .env.local.");

  const people = parseVerteilungsschluessel(xlsxPath);

  const summeAnteil = people.reduce((s, p) => s + p.anteilProzent, 0);
  const summeBetrag = people.reduce((s, p) => s + p.betrag, 0);
  console.log(`Gefunden: ${people.length} aktive Gesellschafter:innen.`);
  console.log(`Summe Anteil: ${summeAnteil.toFixed(2)} % · Summe Betrag: ${summeBetrag.toFixed(2)} €`);
  if (Math.abs(summeAnteil - 100) > 0.5) {
    console.warn(
      `Achtung: Summe der Anteile weicht deutlich von 100 % ab (${summeAnteil.toFixed(2)} %). Bitte Excel-Datei prüfen, bevor importiert wird.`
    );
  }

  await mongoose.connect(mongoUri);
  await Gesellschafter.deleteMany({});
  await Gesellschafter.insertMany(people);
  console.log(`${people.length} Gesellschafter:innen importiert.`);

  // Gesamtvermögen nur beim allerersten Import setzen (aus der Excel-Datei),
  // spätere Anpassungen laufen über den Admin-Bereich und dürfen hier nicht
  // überschrieben werden.
  const bestehend = await Einstellungen.findOne({ schluessel: "global" });
  if (!bestehend) {
    const initialwert = parseGesamtvermoegen(xlsxPath) ?? summeBetrag;
    await Einstellungen.create({ schluessel: "global", gesamtvermoegenEuro: initialwert });
    console.log(`Gesamtvermögen initial gesetzt: ${initialwert.toFixed(2)} €`);
  } else {
    console.log(
      `Gesamtvermögen bereits gesetzt (${bestehend.gesamtvermoegenEuro.toFixed(2)} €) – unverändert gelassen. Anpassung über /admin.`
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
