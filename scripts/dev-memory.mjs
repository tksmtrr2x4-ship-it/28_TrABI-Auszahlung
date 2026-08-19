// Startet einen temporären In-Memory-MongoDB-Server, damit die App auch ohne
// eigenen MongoDB-Atlas-Account lokal getestet werden kann. Daten gehen beim
// Beenden verloren – für die echte Nutzung MONGODB_URI in .env.local setzen.
//
// Ist SEED_XLSX_PATH gesetzt (z.B. in .env.local), wird die In-Memory-DB
// automatisch mit den Daten aus der Excel-Datei befüllt. Außerdem wird das
// Formular-Zeitfenster standardmäßig auf "jetzt geöffnet" gesetzt, damit man
// sofort testen kann (echtes Zeitfenster gilt nur im Produktivbetrieb).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import { parseVerteilungsschluessel, parseGesamtvermoegen } from "./parseVerteilungsschluessel.mjs";

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri("trabi-auszahlung");

console.log(`In-Memory MongoDB gestartet: ${uri}`);

if (process.env.SEED_XLSX_PATH) {
  const GesellschafterSchema = new mongoose.Schema({
    vorname: String,
    nachname: String,
    anteilProzent: Number,
    betrag: Number,
    status: { type: String, default: "Aktiv" },
  });
  const Gesellschafter = mongoose.model("Gesellschafter", GesellschafterSchema);

  const EinstellungenSchema = new mongoose.Schema({
    schluessel: { type: String, required: true, unique: true, default: "global" },
    gesamtvermoegenEuro: { type: Number, required: true },
    aktualisiertAm: { type: Date, default: Date.now },
  });
  const Einstellungen = mongoose.model("Einstellungen", EinstellungenSchema);

  try {
    const people = parseVerteilungsschluessel(process.env.SEED_XLSX_PATH);
    const gesamtvermoegen =
      parseGesamtvermoegen(process.env.SEED_XLSX_PATH) ?? people.reduce((s, p) => s + p.betrag, 0);
    await mongoose.connect(uri);
    await Gesellschafter.insertMany(people);
    await Einstellungen.create({ schluessel: "global", gesamtvermoegenEuro: gesamtvermoegen });
    console.log(`Dev-Seed: ${people.length} Gesellschafter:innen in die In-Memory-DB geladen.`);
    await mongoose.disconnect();
  } catch (err) {
    console.warn(`Dev-Seed übersprungen: ${err.message}`);
  }
} else {
  console.warn(
    "SEED_XLSX_PATH nicht gesetzt – die In-Memory-DB bleibt leer (kein Name im Dropdown auswählbar)."
  );
}

const port = process.env.PORT || "3000";
const child = spawn("npx", ["next", "dev", "-p", port], {
  stdio: "inherit",
  env: {
    ...process.env,
    MONGODB_URI: uri,
    ADMIN_PIN: process.env.ADMIN_PIN || "1234",
    FORM_OPEN_ISO: process.env.FORM_OPEN_ISO || new Date(Date.now() - 60_000).toISOString(),
    FORM_CLOSE_ISO:
      process.env.FORM_CLOSE_ISO || new Date(Date.now() + 7 * 24 * 3600_000).toISOString(),
  },
});

const shutdown = async () => {
  child.kill();
  await mongod.stop();
  process.exit();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
child.on("exit", (code) => shutdown().then(() => process.exit(code ?? 0)));
