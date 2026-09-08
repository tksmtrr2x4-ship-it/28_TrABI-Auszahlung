// Erzeugt eine SEPA-Sammelüberweisung im pain.001.001.09-Format (ISO 20022,
// aktuelle DK-Implementierungsrichtlinie), die sich im Online-Banking der
// meisten Banken (auch privater Konten, z.B. Sparkasse) als
// "Sammelüberweisung" / "Zahlungsdatei" hochladen lässt.
//
// Struktur anhand einer echten, von der Sparkasse selbst exportierten
// Vorlagen-Datei abgeglichen (scripts/referenz-xml/) – bewusst KEIN
// PstlAdr, KEIN BtchBookg, da die Referenzdatei diese nicht enthält und
// jede zusätzliche, nicht bestätigte Annahme ein Risiko für erneute
// Ablehnung ist.
import { normalizeIban, isValidIban } from "./iban";

// Nur dieser Zeichensatz ist im "SEPA-konformen" Zeichensatz zulässig
// (EPC-Rulebook). Umlaute etc. werden transliteriert, alles andere entfernt.
const UMLAUT_MAP = {
  ä: "ae", ö: "oe", ü: "ue", Ä: "Ae", Ö: "Oe", Ü: "Ue", ß: "ss",
};

export function sepaSanitize(text) {
  const transliteriert = String(text || "").replace(
    /[äöüÄÖÜß]/g,
    (ch) => UMLAUT_MAP[ch] || ch
  );
  return transliteriert
    .replace(/[^a-zA-Z0-9/\-?:().,'+ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function xmlEscape(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function agentBlock(bic) {
  // In pain.001.001.09 heißt das Element BICFI (nicht mehr BIC wie in .03).
  return bic
    ? `<FinInstnId><BICFI>${xmlEscape(bic)}</BICFI></FinInstnId>`
    : `<FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId>`;
}

function formatBetrag(value) {
  return value.toFixed(2);
}

// Baut die Zahlungsliste aus den "Ja"-Antworten: normalerweise geht jede
// Zahlung an die eigene IBAN, außer bei manuell als "spendet" markierten
// Personen – die werden ans hinterlegte Spendenkonto umgeleitet, aber mit
// personalisiertem Verwendungszweck (Name bleibt nachvollziehbar, für die
// Buchhaltung). Wer weder gültige eigene IBAN noch (bei Spende) ein
// hinterlegtes Spendenkonto hat, landet in `ausgelassen` statt in der Datei.
export function buildZahlungenAusAntworten(
  antworten,
  { gesamtvermoegenEuro, verwendungszweckVorlage, spendenKontoinhaber, spendenKontoIban }
) {
  const zahlungen = [];
  const ausgelassen = [];

  for (const a of antworten) {
    const name = `${a.vorname} ${a.nachname}`;
    const betrag = (a.anteilProzent / 100) * gesamtvermoegenEuro;

    if (a.spendet) {
      if (!spendenKontoIban || !isValidIban(spendenKontoIban)) {
        ausgelassen.push({ name, grund: "Spendet, aber kein gültiges Spendenkonto hinterlegt" });
        continue;
      }
      zahlungen.push({
        name: spendenKontoinhaber || "Spendenkonto",
        iban: spendenKontoIban,
        betrag,
        verwendungszweck: `Spende (${name}) - ${verwendungszweckVorlage}`,
      });
      continue;
    }

    if (!isValidIban(a.iban)) {
      ausgelassen.push({ name, grund: "Keine gültige IBAN hinterlegt" });
      continue;
    }
    zahlungen.push({
      name,
      iban: a.iban,
      betrag,
      verwendungszweck: `${verwendungszweckVorlage} - ${name}`,
    });
  }

  return { zahlungen, ausgelassen };
}

// zahlungen: [{ name, iban, betrag, verwendungszweck }]
export function buildSepaXml({
  msgId,
  debtorName,
  debtorIban,
  debtorBic,
  executionDate,
  zahlungen,
}) {
  // Volle ISO-8601-Zeit inkl. Millisekunden + Z (UTC), exakt wie im
  // Sparkasse-eigenen Export – nicht auf Sekunden kürzen.
  const creDtTm = new Date().toISOString();
  const nbOfTxs = zahlungen.length;
  const ctrlSum = formatBetrag(zahlungen.reduce((s, z) => s + z.betrag, 0));
  const pmtInfId = `${msgId}-PMT`;

  const transaktionen = zahlungen
    .map((z, i) => {
      const endToEndId = `TRABI-${String(i + 1).padStart(3, "0")}`;
      const name = sepaSanitize(z.name).slice(0, 70);
      const zweck = sepaSanitize(z.verwendungszweck).slice(0, 140);
      // DK-Implementierungsrichtlinie: Ist keine BIC bekannt, wird bei
      // reinen IBAN-Zahlungen das komplette CdtrAgt-Element weggelassen
      // (nicht mit einem Platzhalter gefüllt) – die Referenzdatei bestätigt
      // das: dort fehlt CdtrAgt komplett, wenn keine BIC angegeben wurde.
      const cdtrAgtBlock = z.bic
        ? `\n        <CdtrAgt>\n          ${agentBlock(z.bic)}\n        </CdtrAgt>`
        : "";
      return `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${xmlEscape(endToEndId)}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${formatBetrag(z.betrag)}</InstdAmt>
        </Amt>${cdtrAgtBlock}
        <Cdtr>
          <Nm>${xmlEscape(name)}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id><IBAN>${xmlEscape(normalizeIban(z.iban))}</IBAN></Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${xmlEscape(zweck)}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" ?><Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09 pain.001.001.09.xsd"><CstmrCdtTrfInitn><GrpHdr><MsgId>${xmlEscape(msgId)}</MsgId><CreDtTm>${creDtTm}</CreDtTm><NbOfTxs>${nbOfTxs}</NbOfTxs><CtrlSum>${ctrlSum}</CtrlSum><InitgPty><Nm>${xmlEscape(sepaSanitize(debtorName))}</Nm></InitgPty></GrpHdr><PmtInf><PmtInfId>${xmlEscape(pmtInfId)}</PmtInfId><PmtMtd>TRF</PmtMtd><NbOfTxs>${nbOfTxs}</NbOfTxs><CtrlSum>${ctrlSum}</CtrlSum><PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl></PmtTpInf><ReqdExctnDt><Dt>${executionDate}</Dt></ReqdExctnDt><Dbtr><Nm>${xmlEscape(sepaSanitize(debtorName))}</Nm></Dbtr><DbtrAcct><Id><IBAN>${xmlEscape(normalizeIban(debtorIban))}</IBAN></Id></DbtrAcct><DbtrAgt>${agentBlock(debtorBic)}</DbtrAgt><ChrgBr>SLEV</ChrgBr>${transaktionen}</PmtInf></CstmrCdtTrfInitn></Document>`;
}
