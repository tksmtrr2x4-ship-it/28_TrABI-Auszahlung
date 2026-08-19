import XLSX from "xlsx";

const SHEET_NAME = "Gesellschafterliste";
// Spalten (0-basiert) laut Verteilungsschlüssel-Vorlage:
// A Nr. | B Name | C Klasse lt. Bewertung | D Zugeordnete Klasse |
// E Engagement-Faktor | F Summe Faktoren | G Anteil an Klasse |
// H Klassenanteil am Gesamtvermögen | I Anteil am Gesamtvermögen |
// J Betrag bei Auflösung | K Status
const COL_NAME = 1;
const COL_ANTEIL = 8;
const COL_BETRAG = 9;
const COL_STATUS = 10;

export function parseVerteilungsschluessel(xlsxPath) {
  const workbook = XLSX.readFile(xlsxPath);
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    throw new Error(
      `Blatt "${SHEET_NAME}" nicht gefunden. Vorhandene Blätter: ${workbook.SheetNames.join(", ")}`
    );
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
  const people = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawName = row[COL_NAME];
    if (!rawName) continue;
    if (String(rawName).trim().toLowerCase() === "summe") break;

    const status = row[COL_STATUS];
    if (status !== "Aktiv") continue;

    const anteilFraction = Number(row[COL_ANTEIL]) || 0;
    const betrag = Number(row[COL_BETRAG]) || 0;
    const [nachname, vorname] = String(rawName)
      .split(",")
      .map((teil) => teil.trim());

    people.push({
      nachname: nachname || String(rawName).trim(),
      vorname: vorname || "",
      anteilProzent: anteilFraction * 100,
      betrag,
      status,
    });
  }

  if (people.length === 0) {
    throw new Error(
      "Keine aktiven Gesellschafter:innen gefunden – bitte Spaltenlayout der Excel-Datei prüfen."
    );
  }

  return people;
}
