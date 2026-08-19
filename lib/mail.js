import nodemailer from "nodemailer";
import { ORG_NAME, CONTACT_EMAIL, FORM_CLOSE, formatDeadline, formatEuro, formatProzent } from "./config";
import { formatIban } from "./iban";

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

function buildHtml({ vorname, nachname, anteilProzent, betrag, iban }) {
  const accent = "#0e8c99";
  const accentDark = "#0b6d77";
  const border = "#d7e9ec";

  return `<!doctype html>
<html lang="de">
  <body style="margin:0;padding:0;background:#f4fafb;font-family:Arial,Helvetica,sans-serif;color:#142930;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4fafb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${border};">
            <tr>
              <td style="background:${accent};padding:24px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.3px;">${ORG_NAME}</span><br/>
                <span style="color:#e3f5f7;font-size:13px;">Auflösung der Stufenkasse</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:15px;">Hallo ${vorname},</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
                  vielen Dank für deine Rückmeldung. Wir bestätigen hiermit, dass du dir deinen Anteil
                  an der Stufenkasse auszahlen lassen möchtest. Deine Angaben:
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${border};border-radius:8px;overflow:hidden;margin-bottom:20px;">
                  <tr>
                    <td style="padding:12px 16px;background:#e3f5f7;font-size:13px;color:${accentDark};font-weight:bold;width:50%;">Anteil am Gesamtvermögen</td>
                    <td style="padding:12px 16px;font-size:15px;text-align:right;font-weight:bold;">${formatProzent(anteilProzent)} %</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px;background:#e3f5f7;font-size:13px;color:${accentDark};font-weight:bold;border-top:1px solid ${border};">Auszahlungsbetrag</td>
                    <td style="padding:12px 16px;font-size:15px;text-align:right;font-weight:bold;border-top:1px solid ${border};">${formatEuro(betrag)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px;background:#e3f5f7;font-size:13px;color:${accentDark};font-weight:bold;border-top:1px solid ${border};">Name</td>
                    <td style="padding:12px 16px;font-size:15px;text-align:right;border-top:1px solid ${border};">${vorname} ${nachname}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px;background:#e3f5f7;font-size:13px;color:${accentDark};font-weight:bold;border-top:1px solid ${border};">Hinterlegte IBAN</td>
                    <td style="padding:12px 16px;font-size:15px;text-align:right;font-family:'Courier New',monospace;border-top:1px solid ${border};">${formatIban(iban)}</td>
                  </tr>
                </table>

                <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">
                  <strong>Bitte prüfe die IBAN sorgfältig.</strong> Sollte darin ein Fehler sein, melde
                  dich möglichst schnell und vor Ablauf der Frist bei uns – am einfachsten, indem du
                  das Formular einfach erneut mit der korrigierten IBAN ausfüllst.
                </p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;">
                  Die Rückmeldefrist endet am <strong>${formatDeadline(FORM_CLOSE)}</strong>. Die
                  Auszahlung erfolgt im Anschluss gesammelt für alle Gesellschafter:innen, die sich bis
                  dahin gemeldet haben.
                </p>

                <p style="margin:0 0 4px;font-size:13px;color:#4b6469;">Fragen? Einfach auf diese E-Mail antworten.</p>
                <p style="margin:0;font-size:13px;color:#4b6469;">${CONTACT_EMAIL}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background:#f4fafb;border-top:1px solid ${border};">
                <p style="margin:0;font-size:11px;color:#7c9a9e;line-height:1.5;">
                  Diese Angaben werden ausschließlich zur Abwicklung der Auszahlung im Rahmen der
                  Auflösung der Stufenkasse ${ORG_NAME} verwendet und nicht an Dritte weitergegeben.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendAuszahlungsBestaetigung({
  to,
  vorname,
  nachname,
  anteilProzent,
  betrag,
  iban,
}) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn(
      "GMAIL_USER/GMAIL_APP_PASSWORD nicht gesetzt – E-Mail-Versand wird übersprungen (Dev-Modus)."
    );
    return { skipped: true };
  }

  await getTransporter().sendMail({
    from: `"${ORG_NAME} – Stufenkasse" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Bestätigung deiner Auszahlung – ${ORG_NAME}`,
    html: buildHtml({ vorname, nachname, anteilProzent, betrag, iban }),
  });

  return { skipped: false };
}
