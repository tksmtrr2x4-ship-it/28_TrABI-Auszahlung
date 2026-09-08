"use client";

import { useState } from "react";

export default function BearbeitenModal({ zeile, pin, onClose, onSaved }) {
  const [iban, setIban] = useState(zeile.iban || "");
  const [email, setEmail] = useState(zeile.email || "");
  const [spendet, setSpendet] = useState(zeile.spendet || false);
  const [hinweis, setHinweis] = useState(zeile.bearbeitungsHinweis || "");
  const [speichert, setSpeichert] = useState(false);
  const [fehler, setFehler] = useState(null);

  async function speichern(event) {
    event.preventDefault();
    setSpeichert(true);
    setFehler(null);
    try {
      const res = await fetch(`/api/antworten/${zeile.antwortId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-pin": pin },
        body: JSON.stringify({
          iban: spendet ? undefined : iban,
          email,
          spendet,
          bearbeitungsHinweis: hinweis,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen.");
      onSaved();
    } catch (err) {
      setFehler(err.message);
    } finally {
      setSpeichert(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form
        onSubmit={speichern}
        className="w-full max-w-sm rounded-xl bg-card border border-border p-5 space-y-3"
      >
        <h3 className="text-sm font-semibold">
          {zeile.vorname} {zeile.nachname} bearbeiten
        </h3>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border accent-[color:var(--accent)]"
            checked={spendet}
            onChange={(e) => setSpendet(e.target.checked)}
          />
          Spendet den Betrag (statt Auszahlung auf eigene IBAN)
        </label>

        {!spendet && (
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-1">IBAN</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1">E-Mail</label>
          <input
            type="email"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1">
            Interner Hinweis (z.B. &quot;IBAN per Mail vom 8.9. korrigiert&quot;)
          </label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={hinweis}
            onChange={(e) => setHinweis(e.target.value)}
          />
        </div>

        {fehler && <p className="text-sm text-danger">{fehler}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border text-sm font-medium px-4 py-2"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={speichert}
            className="rounded-lg bg-accent hover:bg-accent-dark disabled:opacity-60 text-white text-sm font-medium px-4 py-2"
          >
            {speichert ? "Speichert …" : "Speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}
