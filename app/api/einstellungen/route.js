import { connectToDatabase } from "@/lib/mongodb";
import { isAdmin, forbiddenResponse } from "@/lib/auth";
import { getGesamtvermoegen, setGesamtvermoegen } from "@/lib/einstellungen";

export async function GET(request) {
  if (!isAdmin(request)) return forbiddenResponse();
  await connectToDatabase();
  const gesamtvermoegenEuro = await getGesamtvermoegen();
  return Response.json({ gesamtvermoegenEuro });
}

export async function PUT(request) {
  if (!isAdmin(request)) return forbiddenResponse();

  const body = await request.json().catch(() => ({}));
  const value = Number(body.gesamtvermoegenEuro);
  if (!Number.isFinite(value) || value < 0) {
    return Response.json({ error: "Bitte einen gültigen, positiven Betrag angeben." }, { status: 400 });
  }

  await connectToDatabase();
  const gesamtvermoegenEuro = await setGesamtvermoegen(value);
  return Response.json({ ok: true, gesamtvermoegenEuro });
}
