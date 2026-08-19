# TrABI 2026 – Auszahlung der Stufenkasse

Öffentliches Formular, das per Link (z.B. in der WhatsApp-Gruppe) geteilt
wird. Jede:r Gesellschafter:in wählt ihren/seinen Namen aus, beantwortet
"Möchtest du dein Geld ausgezahlt bekommen?" und gibt bei Ja IBAN + E-Mail
an. Bei Ja verschickt das System automatisch und sofort eine professionelle
Bestätigungs-Mail mit Anteil (%), Auszahlungsbetrag (€) und der eingegebenen
IBAN. Eine passwortgeschützte Admin-Übersicht zeigt alle Rückmeldungen und
exportiert sie als CSV für die Überweisungen.

**Rückmeldefrist:** 20.08.2026, 20:00 Uhr – 03.09.2026, 20:00 Uhr
(einstellbar in `lib/config.js` bzw. per `FORM_OPEN_ISO` / `FORM_CLOSE_ISO`).

## Wie die Teile zusammenspielen

```
Excel-Verteilungsschlüssel  --npm run seed-->  MongoDB Atlas
 (Name, Anteil %, Betrag €)                          │
                                                       │
Website (Next.js)  <---------------------------------┘
  ↑ öffentlich, gehostet auf Vercel
  │
  ├─ Formular: Name auswählen, Ja/Nein, ggf. IBAN + E-Mail
  │    → speichert Antwort, verschickt bei "Ja" sofort
  │      eine Bestätigungs-Mail (Gmail SMTP)
  │
  └─ /admin (PIN-geschützt): Übersicht + CSV-Export für die Überweisungen
```

Wichtig: Nur **Name** und Anteil/Betrag stammen aus der Excel-Datei. Die
Excel-Datei selbst wird **nie** ins Repository committet oder deployed –
sie wird nur einmalig lokal für den Import gelesen (siehe unten).

## 1. Lokal testen

```bash
npm install
npm run dev:memory
```

Startet die Website unter http://localhost:3000 mit einer temporären
In-Memory-Datenbank (Admin-PIN `1234`). Ist `SEED_XLSX_PATH` in
`.env.local` gesetzt, wird die In-Memory-DB automatisch mit den echten
Namen/Anteilen befüllt. Das Rückmeldefenster ist im Dev-Modus automatisch
"gerade geöffnet", damit man sofort testen kann. Daten gehen beim Beenden
verloren – gut zum Ausprobieren, nicht für den echten Einsatz.

## 2. Echte Datenbank: MongoDB Atlas

Falls für *Gästeliste Abiball* oder ein anderes Stufen-Projekt schon ein
Atlas-Cluster existiert, diesen wiederverwenden und einfach eine neue
Datenbank `trabi-auszahlung` anlegen. Sonst:

1. Auf [mongodb.com/atlas](https://www.mongodb.com/atlas) einen kostenlosen
   Account/Cluster (M0 Free Tier) anlegen.
2. Unter "Database Access" einen Nutzer mit Lese-/Schreibrecht anlegen.
3. Unter "Network Access" `0.0.0.0/0` freigeben (Vercel hat keine festen
   IPs).
4. Connection-String kopieren.

## 3. Verteilungsschlüssel importieren

1. `.env.local.example` nach `.env.local` kopieren.
2. `MONGODB_URI` eintragen (aus Schritt 2).
3. `SEED_XLSX_PATH` auf den lokalen Pfad der Excel-Datei setzen (Blatt
   "Gesellschafterliste" wird gelesen: Name, Anteil %, Betrag €, Status).
4. Import ausführen:

   ```bash
   npm run seed
   ```

   Das Skript gibt die Anzahl importierter Personen sowie die Summe der
   Anteile/Beträge aus – warnt, falls die Summe spürbar von 100 % abweicht
   (dann vorher die Excel-Datei prüfen). Bei jedem erneuten Ausführen wird
   die bestehende Gesellschafterliste ersetzt (bereits erfasste Antworten
   bleiben unberührt, da sie separat gespeichert sind).

## 4. Gmail-Versand einrichten

Für `abijahrgangstu@gmail.com` wird ein **App-Passwort** benötigt (nicht das
normale Gmail-Passwort, das funktioniert nicht für SMTP):

1. Bei [myaccount.google.com/security](https://myaccount.google.com/security)
   einloggen, "2-Schritt-Verifizierung" aktivieren (falls noch nicht
   geschehen).
2. Unter "App-Passwörter" ein neues Passwort erstellen (Name z.B. "TrABI
   Website").
3. Das 16-stellige Passwort **ohne Leerzeichen** als `GMAIL_APP_PASSWORD` in
   `.env.local` (lokal) bzw. bei Vercel als Environment Variable eintragen.

Ohne gesetztes `GMAIL_APP_PASSWORD` wird der Mailversand im Dev-Modus nur
übersprungen (mit Konsolen-Hinweis) – die App stürzt nicht ab.

## 5. Hosting: Vercel

1. Projekt in ein **privates** GitHub-Repo pushen (wichtig: Namen, Anteile
   und später IBANs dürfen nicht in einem öffentlichen Repo landen – die
   IBANs selbst liegen ohnehin nur in der Datenbank, nie im Code).
2. Bei [vercel.com](https://vercel.com) mit GitHub anmelden, Repo
   importieren.
3. In den Projekteinstellungen unter "Environment Variables" eintragen:
   `MONGODB_URI`, `ADMIN_PIN`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`.
   (`SEED_XLSX_PATH` wird dort **nicht** benötigt – der Import läuft nur
   lokal.)
4. Deployen – du bekommst eine URL wie
   `https://trabi-auszahlung.vercel.app`.
5. Diese URL ist der Link, der in die WhatsApp-Gruppe gepostet wird.

## Admin-Übersicht

Unter `/admin` mit der `ADMIN_PIN` anmelden. Zeigt für alle 53
Gesellschafter:innen den Status (Ja / Nein / Ausstehend), Anteil, Betrag,
IBAN, E-Mail und Zeitpunkt – plus Kennzahlen (Anzahl beantwortet/ausstehend,
Summe der auszuzahlenden Beträge). Über "Als CSV exportieren" lässt sich die
komplette Liste für die Überweisungen herunterladen (Excel-kompatibel,
Semikolon-getrennt).

Wer sich verschrieben hat (z.B. falsche IBAN), kann das Formular einfach
erneut ausfüllen – die vorherige Antwort wird überschrieben und eine neue
Bestätigungs-Mail verschickt.

## Datenschutz & Sicherheit

- Es werden nur die Angaben gespeichert, die für die Auszahlung nötig sind:
  Name (aus dem Verteilungsschlüssel), Antwort, IBAN und E-Mail (nur bei
  "Ja").
- Die IBAN wird ausschließlich zur Abwicklung der Auszahlung verwendet,
  nicht an Dritte weitergegeben.
- Das öffentliche Namens-Dropdown zeigt bewusst **keine** Anteile/Beträge
  anderer Personen – diese werden erst nach Auswahl serverseitig
  zugeordnet.
- `ADMIN_PIN` und `MONGODB_URI` sind die "Schlüssel" zu allen IBAN-Daten –
  nicht weitergeben, nicht in öffentlichen Chats posten.
- Bei Bedarf: nach Abschluss der Auszahlungen die `Antwort`-Collection in
  MongoDB Atlas löschen, damit die IBANs nicht unnötig lange gespeichert
  bleiben.

## Projektstruktur

```
app/                     Next.js-Website
  page.js                 Formular-Seite (prüft Frist serverseitig)
  UmfrageForm.jsx          Formular-Logik (Client)
  admin/page.js            PIN-geschützte Übersicht + CSV-Export
  api/gesellschafter/      GET – öffentliche Namensliste (ohne Beträge)
  api/antworten/           POST – Formular-Einreichung, GET (PIN) – Übersicht
lib/                      DB-Verbindung, Auth, IBAN-Validierung, Mailversand, Konfiguration
models/                   Mongoose-Schemas (Gesellschafter, Antwort)
scripts/seed.mjs          Excel-Import
scripts/dev-memory.mjs    Lokaler Testmodus mit In-Memory-DB
```
