// Erzeugt eine SEPA-Sammelüberweisung im pain.001.001.03-Format (ISO 20022),
// die sich im Online-Banking der meisten Banken (auch privater Konten) als
// "Sammelüberweisung" / "Zahlungsdatei" hochladen lässt.
import { normalizeIban } from "./iban";

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
  return bic
    ? `<FinInstnId><BIC>${xmlEscape(bic)}</BIC></FinInstnId>`
    : `<FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId>`;
}

function formatBetrag(value) {
  return value.toFixed(2);
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
  const now = new Date();
  const creDtTm = now.toISOString().slice(0, 19);
  const nbOfTxs = zahlungen.length;
  const ctrlSum = formatBetrag(zahlungen.reduce((s, z) => s + z.betrag, 0));
  const pmtInfId = `${msgId}-PMT`;

  const transaktionen = zahlungen
    .map((z, i) => {
      const endToEndId = `TRABI-${String(i + 1).padStart(3, "0")}`;
      const name = sepaSanitize(z.name).slice(0, 70);
      const zweck = sepaSanitize(z.verwendungszweck).slice(0, 140);
      return `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${xmlEscape(endToEndId)}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${formatBetrag(z.betrag)}</InstdAmt>
        </Amt>
        <CdtrAgt>
          ${agentBlock(z.bic)}
        </CdtrAgt>
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

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${xmlEscape(msgId)}</MsgId>
      <CreDtTm>${creDtTm}</CreDtTm>
      <NbOfTxs>${nbOfTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <InitgPty>
        <Nm>${xmlEscape(sepaSanitize(debtorName))}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${xmlEscape(pmtInfId)}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${nbOfTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <PmtTpInf>
        <SvcLvl><Cd>SEPA</Cd></SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${executionDate}</ReqdExctnDt>
      <Dbtr>
        <Nm>${xmlEscape(sepaSanitize(debtorName))}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id><IBAN>${xmlEscape(normalizeIban(debtorIban))}</IBAN></Id>
      </DbtrAcct>
      <DbtrAgt>
        ${agentBlock(debtorBic)}
      </DbtrAgt>
      <ChrgBr>SLEV</ChrgBr>${transaktionen}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>
`;
}
