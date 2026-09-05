"use client";

import { useState } from "react";

export default function NichtAntworterPanel({ pin, onChanged }) {
  const [liste, setListe] = useState(null);
  const [ladend, setLadend] = useState(false);
  const [ausschliessend, setAusschliessend] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [erfolg, setErfolg] = useState(null);

  async function vorschauLaden() {
    setLadend(true);
    setFehler(null);
    setErfolg(null);
    try {
      const res = await fetch("/api/gesellschafter-ausschliessen", { headers: { "x-pin": pin } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Laden fehlgeschlagen.");
      setListe(data);
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLadend(false);
    }
  }

  async function ausschliessen() {
    if (!liste || liste.length === 0) return;
    setAusschliessend(true);
    setFehler(null);
    try {
      const res = await fetch("/api/gesellschafter-ausschliessen", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pin": pin },
        body: JSON.stringify({ ids: liste.map((g) => g.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ausschließen fehlgeschlagen.");
      setErfolg(`${data.ausgeschlossen} Person(en) ausgeschlossen.`);
      setListe(null);
      onChanged?.();
    } catch (err) {
      setFehler(err.message);
    } finally {
      setAusschliessend(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold mb-1">Nicht-Antworter ausschließen</h2>
      <p className="text-xs text-foreground/50 mb-3">
        Markiert alle Gesellschafter:innen ohne Antwort als "ausgeschlossen" (Frist verpasst, § 6
        AGB). Der Datensatz bleibt erhalten, taucht aber nicht mehr in der aktiven Verteilung auf –
        kein endgültiges Löschen.
      </p>

      {!liste && (
        <button
          onClick={vorschauLaden}
          disabled={ladend}
          className="rounded-lg border border-border hover:border-accent text-sm font-medium px-4 py-2"
        >
          {ladend ? "Lade …" : "Liste anzeigen"}
        </button>
      )}

      {liste && liste.length === 0 && (
        <p className="text-sm text-foreground/60">Aktuell hat jede:r Aktive geantwortet.</p>
      )}

      {liste && liste.length > 0 && (
        <div>
          <ul className="text-sm mb-3 space-y-1">
            {liste.map((g) => (
              <li key={g.id}>
                {g.vorname} {g.nachname} — {g.anteilProzent.toFixed(2)} %
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              onClick={ausschliessen}
              disabled={ausschliessend}
              className="rounded-lg bg-danger hover:opacity-90 disabled:opacity-60 text-white text-sm font-medium px-4 py-2"
            >
              {ausschliessend ? "Schließe aus …" : `${liste.length} Person(en) jetzt ausschließen`}
            </button>
            <button
              onClick={() => setListe(null)}
              className="rounded-lg border border-border text-sm font-medium px-4 py-2"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {fehler && <p className="mt-2 text-sm text-danger">{fehler}</p>}
      {erfolg && <p className="mt-2 text-sm text-accent-dark">{erfolg}</p>}
    </div>
  );
}
