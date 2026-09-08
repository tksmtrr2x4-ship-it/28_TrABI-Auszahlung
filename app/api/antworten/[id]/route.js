import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Antwort from "@/models/Antwort";
import { isAdmin, forbiddenResponse } from "@/lib/auth";
import { isValidIban, normalizeIban } from "@/lib/iban";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Admin: manuelle Korrektur einer einzelnen Antwort – z.B. IBAN/E-Mail
// berichtigen oder "spendet" setzen, wenn die Rückmeldung per E-Mail statt
// über das Formular kam. Wirkt sich auf SEPA-Export und Abschluss-Mail aus.
export async function PATCH(request, { params }) {
  if (!isAdmin(request)) return forbiddenResponse();

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return Response.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  await connectToDatabase();
  const antwort = await Antwort.findById(id);
  if (!antwort) {
    return Response.json({ error: "Antwort nicht gefunden." }, { status: 404 });
  }

  if (body.spendet !== undefined) {
    antwort.spendet = body.spendet === true;
  }

  if (body.iban !== undefined) {
    const iban = normalizeIban(body.iban);
    if (iban && !isValidIban(iban)) {
      return Response.json({ error: "Die eingegebene IBAN ist ungültig." }, { status: 400 });
    }
    antwort.iban = iban || null;
  }

  if (body.email !== undefined) {
    const email = String(body.email || "").trim();
    if (email && !EMAIL_REGEX.test(email)) {
      return Response.json({ error: "Bitte eine gültige E-Mail-Adresse angeben." }, { status: 400 });
    }
    antwort.email = email || null;
  }

  if (body.bearbeitungsHinweis !== undefined) {
    antwort.bearbeitungsHinweis = String(body.bearbeitungsHinweis || "").trim() || null;
  }

  antwort.bearbeitetAm = new Date();
  await antwort.save();

  return Response.json({ ok: true });
}
