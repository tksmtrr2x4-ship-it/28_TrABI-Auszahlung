"use client";

import { useEffect, useState } from "react";

function euro(value) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

function standardAusfuehrungsdatum() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().slice(0, 10);
}

export default function SepaPanel({ pin }) {
  const [kontoinhaber, setKontoinhaber] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [spendenKontoinhaber, setSpendenKontoinhaber] = useState("");
  const [spendenKontoIban, setSpendenKontoIban] = useState("");
  const [ausfuehrungsdatum, setAusfuehrungsdatum] = useState(standardAusfuehrungsdatum());
  const [verwendungszweck, setVerwendungszweck] = useState("Stufenkasse TrABI 2026");
  const [zahlungen, setZahlungen] = useState(null);
  const [ausgelassen, setAusgelassen] = useState([]);
  const [ladend, setLadend] = useState(false);
  const [erzeugend, setErzeugend] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [erfolg, setErfolg] = useState(null);

  async function laden() {
    setLadend(true);
    setFehler(null);
    try {
      const res = await fetch("/api/sepa", { headers: { "x-pin": pin } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Laden fehlgeschlagen.");
      setKontoinhaber(data.sepaKontoinhaber || "");
      setIban(data.sepaIban || "");
      setBic(data.sepaBic || "");
      setSpendenKontoinhaber(data.spendenKontoinhaber || "");
      setSpendenKontoIban(data.spendenKontoIban || "");
      setZahlungen(data.zahlungen);
      setAusgelassen(data.ausgelassen || []);
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLadend(false);
    }
  }

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function xmlHerunterladen() {
    if (!kontoinhaber || !iban) {
      setFehler("Bitte Kontoinhaber und IBAN angeben.");
      return;
    }
    setErzeugend(true);
    setFehler(null);
    setErfolg(null);
    try {
      const res = await fetch("/api/sepa", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pin": pin },
        body: JSON.stringify({
          sepaKontoinhaber: kontoinhaber,
          sepaIban: iban,
          sepaBic: bic,
          spendenKontoinhaber,
          spendenKontoIban,
          executionDate: ausfuehrungsdatum,
          verwendungszweckVorlage: verwendungszweck,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erzeugen fehlgeschlagen.");
      }
      const anzahlAusgelassen = res.headers.get("X-Ausgelassen");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trabi-sepa-${ausfuehrungsdatum}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      setErfolg(
        `SEPA-XML mit ${zahlungen?.length ?? 0} Zahlungen heruntergeladen.` +
          (anzahlAusgelassen && Number(anzahlAusgelassen) > 0
            ? ` ${anzahlAusgelassen} Person(en) wurden ausgelassen (siehe Liste unten).`
            : "")
      );
      await laden();
    } catch (err) {
      setFehler(err.message);
    } finally {
      setErzeugend(false);
    }
  }

  const summe = zahlungen?.reduce((s, z) => s + z.betrag, 0) ?? 0;

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold mb-1">SEPA-Sammelüberweisung</h2>
      <p className="text-xs text-foreground/50 mb-3">
        Erzeugt eine SEPA-XML-Datei (pain.001.001.09), die sich im Online-Banking eurer Bank als
        Sammelüberweisung hochladen lässt – alle &quot;Ja&quot;-Antworten mit gültiger IBAN in einer Datei.
        Wer im Admin als &quot;spendet&quot; markiert ist, wird automatisch ans Spendenkonto
        umgeleitet (mit Namen im Verwendungszweck).
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1">
            Kontoinhaber (Absenderkonto)
          </label>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={kontoinhaber}
            onChange={(e) => setKontoinhaber(e.target.value)}
            placeholder="z.B. Stufenkasse TrABI 2026"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1">
            IBAN (Absenderkonto)
          </label>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder="DE12 3456 7890 1234 5678 90"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1">
            BIC (optional)
          </label>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={bic}
            onChange={(e) => setBic(e.target.value)}
            placeholder="Nur falls von der Bank verlangt"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1">
            Ausführungsdatum
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={ausfuehrungsdatum}
            onChange={(e) => setAusfuehrungsdatum(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-foreground/60 mb-1">
            Verwendungszweck (pro Person wird &quot;- Vorname Nachname&quot; ergänzt)
          </label>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={verwendungszweck}
            onChange={(e) => setVerwendungszweck(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-accent-light/40 p-3 mb-4">
        <p className="text-xs font-medium text-accent-dark mb-2">
          Spendenkonto (für Personen, die laut Admin-Markierung spenden)
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1">
              Kontoinhaber Spendenkonto
            </label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              value={spendenKontoinhaber}
              onChange={(e) => setSpendenKontoinhaber(e.target.value)}
              placeholder="z.B. Misereor-Spendenkonto (Fr. Auer)"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1">
              IBAN Spendenkonto
            </label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              value={spendenKontoIban}
              onChange={(e) => setSpendenKontoIban(e.target.value)}
              placeholder="Nur nötig, wenn jemand spendet"
            />
          </div>
        </div>
      </div>

      {!ladend && zahlungen && (
        <p className="text-xs text-foreground/60 mb-3">
          {zahlungen.length} Zahlung(en) in der Datei, Summe {euro(summe)}.
        </p>
      )}

      {ausgelassen.length > 0 && (
        <div className="text-xs text-danger mb-3">
          {ausgelassen.length} Person(en) werden ausgelassen:
          <ul className="list-disc list-inside">
            {ausgelassen.map((a, i) => (
              <li key={i}>
                {a.name} – {a.grund}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={xmlHerunterladen}
        disabled={erzeugend || ladend}
        className="rounded-lg bg-accent hover:bg-accent-dark disabled:opacity-60 text-white text-sm font-medium px-4 py-2"
      >
        {erzeugend ? "Erzeuge …" : "SEPA-XML herunterladen"}
      </button>

      {fehler && <p className="mt-2 text-sm text-danger">{fehler}</p>}
      {erfolg && <p className="mt-2 text-sm text-accent-dark">{erfolg}</p>}
    </div>
  );
}
