import PDFDocument from "pdfkit";
import { ORG_NAME, CONTACT_EMAIL, formatEuro, formatProzent } from "./config";

const ACCENT = "#0e8c99";
const ACCENT_DARK = "#0b6d77";
const TEXT = "#142930";
const MUTED = "#5a7478";
const BORDER = "#d7e9ec";

function heute() {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

// Baut das finale Abschluss-PDF für eine Person und gibt es als Buffer
// zurück (zum direkten Anhängen an eine E-Mail, ohne Zwischenspeicherung
// auf der Festplatte).
export function buildAbschlussPdf({ vorname, nachname, anteilProzent, betrag, erklaerungText }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const marginX = 56;
    const contentWidth = pageWidth - marginX * 2;

    // Kopfbalken
    doc.rect(0, 0, pageWidth, 96).fill(ACCENT);
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(20)
      .text(ORG_NAME, marginX, 32);
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#e3f5f7")
      .text("Abschlussbestätigung – Auflösung der Stufenkasse", marginX, 58);

    let y = 140;

    doc
      .fillColor(TEXT)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("Endgültige Auszahlung", marginX, y);
    y += 30;

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(TEXT)
      .text(`Hallo ${vorname},`, marginX, y);
    y += 22;

    doc
      .fontSize(11)
      .fillColor(TEXT)
      .text(
        "nach Ablauf der Rückmeldefrist und Abschluss aller offenen Posten der Stufenkasse " +
          "teilen wir dir hiermit deinen endgültigen, verbindlichen Auszahlungsbetrag mit.",
        marginX,
        y,
        { width: contentWidth, lineGap: 3 }
      );
    y = doc.y + 20;

    // Tabelle: Anteil / Betrag / Name
    const rowHeight = 34;
    const rows = [
      ["Anteil am Gesamtvermögen (verbindlich)", `${formatProzent(anteilProzent)} %`],
      ["Endgültiger Auszahlungsbetrag", formatEuro(betrag)],
      ["Name", `${vorname} ${nachname}`],
    ];

    doc.roundedRect(marginX, y, contentWidth, rowHeight * rows.length, 6).stroke(BORDER);
    rows.forEach(([label, value], i) => {
      const rowY = y + i * rowHeight;
      if (i > 0) {
        doc.moveTo(marginX, rowY).lineTo(marginX + contentWidth, rowY).stroke(BORDER);
      }
      doc.rect(marginX, rowY, contentWidth * 0.55, rowHeight).fill("#e3f5f7");
      doc
        .fillColor(ACCENT_DARK)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(label, marginX + 14, rowY + 12, { width: contentWidth * 0.55 - 24 });
      doc
        .fillColor(TEXT)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(value, marginX + contentWidth * 0.55, rowY + 10, {
          width: contentWidth * 0.45 - 14,
          align: "right",
        });
    });
    y += rowHeight * rows.length + 28;

    if (erklaerungText && erklaerungText.trim()) {
      doc
        .fillColor(ACCENT_DARK)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Erläuterung", marginX, y);
      y = doc.y + 8;
      doc
        .fillColor(TEXT)
        .font("Helvetica")
        .fontSize(10.5)
        .text(erklaerungText.trim(), marginX, y, { width: contentWidth, lineGap: 3 });
      y = doc.y + 20;
    }

    doc
      .fillColor(TEXT)
      .font("Helvetica")
      .fontSize(10.5)
      .text(
        "Dieser Betrag ist endgültig und ersetzt alle zuvor mitgeteilten, vorläufigen Schätzungen. " +
          "Die Auszahlung erfolgt auf die von dir zuletzt angegebene IBAN.",
        marginX,
        y,
        { width: contentWidth, lineGap: 3 }
      );
    y = doc.y + 24;

    doc
      .fillColor(MUTED)
      .fontSize(9.5)
      .text(`Fragen? Schreib uns an ${CONTACT_EMAIL}`, marginX, y);

    // Fußzeile
    const footerY = doc.page.height - 60;
    doc
      .moveTo(marginX, footerY)
      .lineTo(pageWidth - marginX, footerY)
      .stroke(BORDER);
    doc
      .fillColor(MUTED)
      .fontSize(8.5)
      .text(`${ORG_NAME} · Erstellt am ${heute()}`, marginX, footerY + 10);

    doc.end();
  });
}
