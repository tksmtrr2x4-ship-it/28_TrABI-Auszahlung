// ISO 7064 mod-97-10 Prüfsummen-Check, keine externe Abhängigkeit nötig.
export function normalizeIban(raw) {
  return String(raw || "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function isValidIban(raw) {
  const iban = normalizeIban(raw);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const converted = rearranged.replace(/[A-Z]/g, (ch) =>
    (ch.charCodeAt(0) - 55).toString()
  );

  try {
    return BigInt(converted) % 97n === 1n;
  } catch {
    return false;
  }
}

export function formatIban(raw) {
  const iban = normalizeIban(raw);
  return iban.match(/.{1,4}/g)?.join(" ") ?? iban;
}
