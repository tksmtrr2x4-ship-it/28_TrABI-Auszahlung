import { connectToDatabase } from "@/lib/mongodb";
import Gesellschafter from "@/models/Gesellschafter";

// Öffentlich: liefert nur Namen + ID für das Auswahl-Dropdown im Formular.
// Bewusst OHNE Anteil/Betrag, damit niemand die Auszahlungsdaten anderer
// Gesellschafter:innen einsehen kann.
export async function GET() {
  await connectToDatabase();
  const liste = await Gesellschafter.find({ status: "Aktiv" })
    .select("_id vorname nachname")
    .sort({ nachname: 1, vorname: 1 })
    .lean();

  return Response.json(
    liste.map((g) => ({
      id: g._id.toString(),
      vorname: g.vorname,
      nachname: g.nachname,
    }))
  );
}
