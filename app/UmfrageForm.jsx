"use client";

import { useEffect, useState } from "react";
import { AGB_VERSION } from "@/lib/agb";
import AgbInhalt from "./AgbInhalt";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent";

export default function UmfrageForm({ deadline }) {
  const [namen, setNamen] = useState([]);
  const [ladeFehler, setLadeFehler] = useState(null);
  const [gesellschafterId, setGesellschafterId] = useState("");
  const [moechteAuszahlung, setMoechteAuszahlung] = useState(null);
  const [iban, setIban] = useState("");
  const [email, setEmail] = useState("");
  const [agbAkzeptiert, setAgbAkzeptiert] = useState(false);
  const [agbOffen, setAgbOffen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);

  useEffect(() => {
    fetch("/api/gesellschafter")
      .then((res) => {
        if (!res.ok) throw new Error("Liste konnte nicht geladen werden.");
        return res.json();
      })
      .then(setNamen)
      .catch((err) => setLadeFehler(err.message));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setFehler(null);

    if (!gesellschafterId) {
      setFehler("Bitte wähle deinen Namen aus.");
      return;
    }
    if (moechteAuszahlung === null) {
      setFehler("Bitte beantworte die Frage.");
      return;
    }
    if (!agbAkzeptiert) {
      setFehler("Bitte bestätige die AGB, um fortzufahren.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/antworten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gesellschafterId,
          moechteAuszahlung,
          iban: moechteAuszahlung ? iban : undefined,
          email: moechteAuszahlung ? email : undefined,
          agbAkzeptiert,
          agbVersion: AGB_VERSION,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Etwas ist schiefgelaufen.");
      }
      setErgebnis({ moechteAuszahlung, emailHinweis: data.emailHinweis });
    } catch (err) {
      setFehler(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (ergebnis) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-accent-light flex items-center justify-center text-accent-dark text-2xl">
          ✓
        </div>
        <h2 className="text-lg font-semibold mb-2">Danke für deine Rückmeldung</h2>
        {ergebnis.moechteAuszahlung ? (
          <p className="text-sm text-foreground/70 leading-relaxed">
            Wir haben dir eine Bestätigung mit deinem Anteil und dem aktuell
            voraussichtlichen Betrag per E-Mail geschickt. Prüfe dort bitte auch
            deine IBAN. Verbindlich ist nur dein Prozentanteil — der Euro-Betrag
            ist vorläufig, da die Kasse noch belastet wird.
          </p>
        ) : (
          <p className="text-sm text-foreground/70 leading-relaxed">
            Deine Rückmeldung wurde gespeichert.
          </p>
        )}
        {ergebnis.emailHinweis && (
          <p className="mt-3 text-sm text-danger">{ergebnis.emailHinweis}</p>
        )}
        <button
          type="button"
          className="mt-6 text-xs underline text-foreground/60 hover:text-accent"
          onClick={() => {
            setErgebnis(null);
            setGesellschafterId("");
            setMoechteAuszahlung(null);
            setIban("");
            setEmail("");
            setAgbAkzeptiert(false);
          }}
        >
          Angaben korrigieren
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="name">
          Dein Name
        </label>
        {ladeFehler ? (
          <p className="text-sm text-danger">{ladeFehler}</p>
        ) : (
          <select
            id="name"
            className={inputClass}
            value={gesellschafterId}
            onChange={(e) => setGesellschafterId(e.target.value)}
            required
          >
            <option value="" disabled>
              {namen.length ? "Bitte auswählen …" : "Lade Namen …"}
            </option>
            {namen.map((n) => (
              <option key={n.id} value={n.id}>
                {n.vorname} {n.nachname}
              </option>
            ))}
          </select>
        )}
      </div>

      <fieldset>
        <legend className="block text-sm font-medium mb-1.5">
          Möchtest du dein Geld ausgezahlt bekommen?
        </legend>
        <div className="flex gap-3">
          <RadioCard
            label="Ja"
            selected={moechteAuszahlung === true}
            onClick={() => setMoechteAuszahlung(true)}
          />
          <RadioCard
            label="Nein"
            selected={moechteAuszahlung === false}
            onClick={() => setMoechteAuszahlung(false)}
          />
        </div>
      </fieldset>

      {moechteAuszahlung === true && (
        <div className="space-y-4 rounded-xl border border-border bg-accent-light/40 p-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="iban">
              IBAN
            </label>
            <input
              id="iban"
              className={inputClass}
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="DE12 3456 7890 1234 5678 90"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="email">
              E-Mail-Adresse (für deine Bestätigung)
            </label>
            <input
              id="email"
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@beispiel.de"
              required
            />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border p-4">
        <button
          type="button"
          onClick={() => setAgbOffen((v) => !v)}
          className="text-sm text-accent hover:underline font-medium"
        >
          {agbOffen ? "AGB ausblenden" : "AGB lesen"}
        </button>
        {agbOffen && (
          <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-border bg-background p-4">
            <AgbInhalt />
          </div>
        )}
        <label className="mt-3 flex items-start gap-2.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border accent-[color:var(--accent)]"
            checked={agbAkzeptiert}
            onChange={(e) => setAgbAkzeptiert(e.target.checked)}
            required
          />
          <span>
            Ich habe die{" "}
            <a href="/agb" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              AGB für das Auszahlungsprogramm
            </a>{" "}
            gelesen und akzeptiere sie.
          </span>
        </label>
      </div>

      {fehler && <p className="text-sm text-danger">{fehler}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-accent hover:bg-accent-dark disabled:opacity-60 text-white font-medium text-sm py-2.5 transition-colors"
      >
        {submitting ? "Wird gesendet …" : "Absenden"}
      </button>

      <p className="text-center text-xs text-foreground/50">
        Rückmeldefrist: {deadline}
      </p>
    </form>
  );
}

function RadioCard({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
        selected
          ? "border-accent bg-accent text-white"
          : "border-border bg-background text-foreground hover:border-accent"
      }`}
    >
      {label}
    </button>
  );
}
