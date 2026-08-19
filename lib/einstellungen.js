import Einstellungen from "@/models/Einstellungen";

// Fallback, falls noch nie ein Wert gesetzt wurde (z.B. frisch aufgesetzte
// Datenbank ohne Seed). Entspricht dem Stand aus dem Verteilungsschlüssel
// zum Zeitpunkt des Projektstarts.
const DEFAULT_GESAMTVERMOEGEN = 2332.62;

export async function getGesamtvermoegen() {
  const doc = await Einstellungen.findOne({ schluessel: "global" }).lean();
  if (doc) return doc.gesamtvermoegenEuro;

  const neu = await Einstellungen.create({
    schluessel: "global",
    gesamtvermoegenEuro: DEFAULT_GESAMTVERMOEGEN,
  });
  return neu.gesamtvermoegenEuro;
}

export async function setGesamtvermoegen(value) {
  const doc = await Einstellungen.findOneAndUpdate(
    { schluessel: "global" },
    { $set: { gesamtvermoegenEuro: value, aktualisiertAm: new Date() } },
    { upsert: true, returnDocument: "after" }
  );
  return doc.gesamtvermoegenEuro;
}
