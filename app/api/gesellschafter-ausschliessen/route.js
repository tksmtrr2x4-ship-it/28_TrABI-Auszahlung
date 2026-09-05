import { connectToDatabase } from "@/lib/mongodb";
import Gesellschafter from "@/models/Gesellschafter";
import Antwort from "@/models/Antwort";
import { isAdmin, forbiddenResponse } from "@/lib/auth";

const AUSGESCHLOSSEN_STATUS = "Ausgeschlossen (Frist verpasst)";

async function findeNichtAntworter() {
  const [gesellschafter, antworten] = await Promise.all([
    Gesellschafter.find({ status: "Aktiv" }).sort({ nachname: 1, vorname: 1 }).lean(),
    Antwort.find({}, { gesellschafter: 1 }).lean(),
  ]);
  const beantwortetIds = new Set(antworten.map((a) => a.gesellschafter.toString()));
  return gesellschafter.filter((g) => !beantwortetIds.has(g._id.toString()));
}

// Admin: Vorschau, wer beim Ausschließen betroffen wäre (keine Änderung).
export async function GET(request) {
  if (!isAdmin(request)) return forbiddenResponse();
  await connectToDatabase();
  const nichtAntworter = await findeNichtAntworter();
  return Response.json(
    nichtAntworter.map((g) => ({
      id: g._id.toString(),
      vorname: g.vorname,
      nachname: g.nachname,
      anteilProzent: g.anteilProzent,
    }))
  );
}

// Admin: markiert alle aktuell ohne Antwort verbliebenen Gesellschafter:innen
// als ausgeschlossen (kein Hard-Delete – Datensatz bleibt für die Buchhaltung
// nachvollziehbar, taucht aber nicht mehr in der aktiven Verteilung auf).
export async function POST(request) {
  if (!isAdmin(request)) return forbiddenResponse();

  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : null;
  if (!ids || ids.length === 0) {
    return Response.json({ error: "Keine IDs übergeben." }, { status: 400 });
  }

  await connectToDatabase();
  // Serverseitig neu ermitteln statt der Client-Liste blind zu vertrauen –
  // schließt nur aus, wer wirklich (noch) aktiv und unbeantwortet ist.
  const nichtAntworter = await findeNichtAntworter();
  const gueltigeIds = new Set(nichtAntworter.map((g) => g._id.toString()));
  const zumAusschliessen = ids.filter((id) => gueltigeIds.has(id));

  if (zumAusschliessen.length === 0) {
    return Response.json({ error: "Keine der übergebenen IDs ist (noch) ausschließbar." }, { status: 409 });
  }

  await Gesellschafter.updateMany(
    { _id: { $in: zumAusschliessen } },
    { $set: { status: AUSGESCHLOSSEN_STATUS } }
  );

  return Response.json({ ok: true, ausgeschlossen: zumAusschliessen.length });
}
