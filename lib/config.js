export const ORG_NAME = process.env.ORG_NAME || "TrABI 2026";

export const FORM_OPEN = new Date(
  process.env.FORM_OPEN_ISO || "2026-08-19T16:22:00+02:00"
);
export const FORM_CLOSE = new Date(
  process.env.FORM_CLOSE_ISO || "2026-09-02T22:00:00+02:00"
);

export const CONTACT_EMAIL = process.env.GMAIL_USER || "abijahrgangstu@gmail.com";

export function formularPhase(now = new Date()) {
  if (now < FORM_OPEN) return "vor";
  if (now > FORM_CLOSE) return "nach";
  return "offen";
}

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

export function formatDeadline(date) {
  return `${DATE_FORMAT.format(date)} Uhr`;
}

export function formatEuro(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatProzent(value) {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
