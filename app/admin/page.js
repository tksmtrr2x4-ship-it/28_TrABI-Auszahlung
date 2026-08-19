"use client";

import { useMemo, useState } from "react";
import { ORG_NAME } from "@/lib/config";

function euro(value) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}
function prozent(value) {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
function zeitpunkt(value) {
  if (!value) return "–";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [zeilen, setZeilen] = useState(null);
  const [gesamtvermoegen, setGesamtvermoegen] = useState(null);
  const [gesamtvermoegenEntwurf, setGesamtvermoegenEntwurf] = useState("");
  const [speichertGesamtvermoegen, setSpeichertGesamtvermoegen] = useState(false);
  const [gesamtvermoegenFehler, setGesamtvermoegenFehler] = useState(null);
  const [fehler, setFehler] = useState(null);
  const [ladend, setLadend] = useState(false);

  async function laden(aktuellePin) {
    const res = await fetch("/api/antworten", { headers: { "x-pin": aktuellePin } });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Zugriff verweigert.");
    }
    const data = await res.json();
    setZeilen(data.zeilen);
    setGesamtvermoegen(data.gesamtvermoegenEuro);
    setGesamtvermoegenEntwurf(String(data.gesamtvermoegenEuro));
  }

  async function anmelden(event) {
    event.preventDefault();
    setLadend(true);
    setFehler(null);
    try {
      await laden(pin);
    } catch (err) {
      setFehler(err.message);
      setZeilen(null);
    } finally {
      setLadend(false);
    }
  }

  async function gesamtvermoegenSpeichern(event) {
    event.preventDefault();
    const value = Number(gesamtvermoegenEntwurf.replace(",", "."));
    if (!Number.isFinite(value) || value < 0) {
      setGesamtvermoegenFehler("Bitte einen gültigen Betrag angeben.");
      return;
    }
    setSpeichertGesamtvermoegen(true);
    setGesamtvermoegenFehler(null);
    try {
      const res = await fetch("/api/einstellungen", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-pin": pin },
        body: JSON.stringify({ gesamtvermoegenEuro: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen.");
      // Beträge in der Tabelle sofort mit dem neuen Gesamtvermögen neu laden.
      await laden(pin);
    } catch (err) {
      setGesamtvermoegenFehler(err.message);
    } finally {
      setSpeichertGesamtvermoegen(false);
    }
  }

  const stats = useMemo(() => {
    if (!zeilen) return null;
    const beantwortet = zeilen.filter((z) => z.geantwortet);
    const ja = zeilen.filter((z) => z.moechteAuszahlung === true);
    const nein = zeilen.filter((z) => z.moechteAuszahlung === false);
    const summeJa = ja.reduce((s, z) => s + z.betrag, 0);
    return {
      gesamt: zeilen.length,
      beantwortet: beantwortet.length,
      ausstehend: zeilen.length - beantwortet.length,
      ja: ja.length,
      nein: nein.length,
      summeJa,
    };
  }, [zeilen]);

  function exportCsv() {
    if (!zeilen) return;
    const header = [
      "Nachname",
      "Vorname",
      "Anteil (%, verbindlich)",
      "Betrag (EUR, vorläufig)",
      "Antwort",
      "IBAN",
      "E-Mail",
      "E-Mail-Status",
      "AGB-Version",
      "AGB akzeptiert am",
      "Zeitpunkt",
    ];
    const rows = zeilen.map((z) => [
      z.nachname,
      z.vorname,
      prozent(z.anteilProzent),
      z.betrag.toFixed(2).replace(".", ","),
      z.geantwortet ? (z.moechteAuszahlung ? "Ja" : "Nein") : "Ausstehend",
      z.iban || "",
      z.email || "",
      z.emailStatus || "",
      z.agbVersion || "",
      z.agbAkzeptiertAm ? zeitpunkt(z.agbAkzeptiertAm) : "",
      z.aktualisiertAm ? zeitpunkt(z.aktualisiertAm) : "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trabi-auszahlung-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!zeilen) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <form onSubmit={anmelden} className="w-full max-w-xs space-y-3">
          <h1 className="text-lg font-semibold text-center mb-4">
            {ORG_NAME} · Admin
          </h1>
          <input
            type="password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Admin-PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
          />
          {fehler && <p className="text-sm text-danger">{fehler}</p>}
          <button
            type="submit"
            disabled={ladend}
            className="w-full rounded-lg bg-accent hover:bg-accent-dark disabled:opacity-60 text-white font-medium text-sm py-2.5"
          >
            {ladend ? "Prüfe …" : "Anmelden"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold">{ORG_NAME} · Rückmeldungen</h1>
        <button
          onClick={exportCsv}
          className="rounded-lg bg-accent hover:bg-accent-dark text-white text-sm font-medium px-4 py-2"
        >
          Als CSV exportieren
        </button>
      </div>

      <form
        onSubmit={gesamtvermoegenSpeichern}
        className="mb-6 rounded-xl border border-border bg-card p-4 flex flex-wrap items-end gap-3"
      >
        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1" htmlFor="gesamtvermoegen">
            Gesamtvermögen der Stufenkasse (aktuell, vorläufig)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="gesamtvermoegen"
              type="text"
              inputMode="decimal"
              className="w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              value={gesamtvermoegenEntwurf}
              onChange={(e) => setGesamtvermoegenEntwurf(e.target.value)}
            />
            <span className="text-sm text-foreground/60">€</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={speichertGesamtvermoegen}
          className="rounded-lg bg-accent hover:bg-accent-dark disabled:opacity-60 text-white text-sm font-medium px-4 py-2"
        >
          {speichertGesamtvermoegen ? "Speichert …" : "Aktualisieren"}
        </button>
        <p className="text-xs text-foreground/50 w-full">
          Aktuell hinterlegt: {gesamtvermoegen !== null ? euro(gesamtvermoegen) : "–"}. Änderungen
          wirken sich sofort auf alle unten angezeigten Beträge sowie auf künftig verschickte
          Bestätigungs-E-Mails aus (bereits verschickte E-Mails werden nicht automatisch neu
          versendet).
        </p>
        {gesamtvermoegenFehler && <p className="text-sm text-danger w-full">{gesamtvermoegenFehler}</p>}
      </form>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <Stat label="Gesamt" value={stats.gesamt} />
          <Stat label="Beantwortet" value={stats.beantwortet} />
          <Stat label="Ausstehend" value={stats.ausstehend} accent />
          <Stat label="Ja / Nein" value={`${stats.ja} / ${stats.nein}`} />
          <Stat label="Summe (Ja, vorläufig)" value={euro(stats.summeJa)} />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-accent-light text-accent-dark text-left">
            <tr>
              <Th>Name</Th>
              <Th>Anteil (verbindlich)</Th>
              <Th>Betrag (vorläufig)</Th>
              <Th>Antwort</Th>
              <Th>IBAN</Th>
              <Th>E-Mail</Th>
              <Th>E-Mail-Status</Th>
              <Th>Zeitpunkt</Th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <tr key={z.id} className="border-t border-border">
                <Td>{z.vorname} {z.nachname}</Td>
                <Td>{prozent(z.anteilProzent)} %</Td>
                <Td>{euro(z.betrag)}</Td>
                <Td>
                  {!z.geantwortet && <span className="text-foreground/40">Ausstehend</span>}
                  {z.geantwortet && z.moechteAuszahlung && <span className="text-accent-dark font-medium">Ja</span>}
                  {z.geantwortet && !z.moechteAuszahlung && <span>Nein</span>}
                </Td>
                <Td className="font-mono text-xs">{z.iban || "–"}</Td>
                <Td>{z.email || "–"}</Td>
                <Td>{z.emailStatus || "–"}</Td>
                <Td>{zeitpunkt(z.aktualisiertAm)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-foreground/50">{label}</p>
      <p className={`text-lg font-semibold ${accent ? "text-accent-dark" : ""}`}>{value}</p>
    </div>
  );
}
function Th({ children }) {
  return <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
