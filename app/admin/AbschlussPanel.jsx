"use client";

import { useEffect, useState } from "react";

function euro(value) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

export default function AbschlussPanel({ pin }) {
  const [text, setText] = useState("");
  const [empfaenger, setEmpfaenger] = useState(null);
  const [testEmail, setTestEmail] = useState("");
  const [alleErneut, setAlleErneut] = useState(false);
  const [ladend, setLadend] = useState(false);
  const [sendetTest, setSendetTest] = useState(false);
  const [sendetAlle, setSendetAlle] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);

  async function laden() {
    setLadend(true);
    setFehler(null);
    try {
      const res = await fetch("/api/abschluss", { headers: { "x-pin": pin } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Laden fehlgeschlagen.");
      setText(data.abschlussText || "");
      setEmpfaenger(data.empfaenger);
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

  async function testSenden() {
    if (!testEmail) {
      setFehler("Bitte eine Test-E-Mail-Adresse angeben.");
      return;
    }
    setSendetTest(true);
    setFehler(null);
    setErgebnis(null);
    try {
      const res = await fetch("/api/abschluss", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pin": pin },
        body: JSON.stringify({ abschlussText: text, testEmailAn: testEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Test-Mail fehlgeschlagen.");
      setErgebnis(`Test-PDF wurde an ${testEmail} gesendet.`);
    } catch (err) {
      setFehler(err.message);
    } finally {
      setSendetTest(false);
    }
  }

  async function alleSenden() {
    const anzahlOffen = empfaenger?.filter((e) => alleErneut || e.abschlussStatus !== "gesendet").length ?? 0;
    if (anzahlOffen === 0) {
      setFehler("Niemand zu versenden.");
      return;
    }
    if (
      !window.confirm(
        `Abschluss-Mail inkl. PDF wirklich an ${anzahlOffen} Person(en) senden? Das kann nicht automatisch rückgängig gemacht werden.`
      )
    ) {
      return;
    }
    setSendetAlle(true);
    setFehler(null);
    setErgebnis(null);
    try {
      const res = await fetch("/api/abschluss", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pin": pin },
        body: JSON.stringify({ abschlussText: text, alleErneut }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Versand fehlgeschlagen.");
      setErgebnis(
        `${data.gesendet} E-Mail(s) versendet.` +
          (data.fehler?.length ? ` Fehler bei: ${data.fehler.join(", ")}` : "")
      );
      await laden();
    } catch (err) {
      setFehler(err.message);
    } finally {
      setSendetAlle(false);
    }
  }

  const nochOffen = empfaenger?.filter((e) => e.abschlussStatus !== "gesendet").length ?? 0;

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold mb-1">Abschluss versenden</h2>
      <p className="text-xs text-foreground/50 mb-3">
        Verschickt an alle, die "Ja" geantwortet haben, den endgültigen Betrag als E-Mail + PDF –
        inklusive deiner Erläuterung unten. Bereits gesendete werden beim normalen Versand
        übersprungen, außer du aktivierst "alle erneut senden".
      </p>

      <label className="block text-xs font-medium text-foreground/60 mb-1" htmlFor="abschlussText">
        Erläuterungstext (z.B. Begründung für einen geringeren Betrag)
      </label>
      <textarea
        id="abschlussText"
        rows={5}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent mb-3"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Liebe Gesellschafter:innen, ..."
      />

      <div className="flex flex-wrap items-end gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1" htmlFor="testEmail">
            Test-Mail an
          </label>
          <input
            id="testEmail"
            type="email"
            className="w-56 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="du@beispiel.de"
          />
        </div>
        <button
          onClick={testSenden}
          disabled={sendetTest}
          className="rounded-lg border border-border hover:border-accent text-sm font-medium px-4 py-2"
        >
          {sendetTest ? "Sendet …" : "Testmail senden"}
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm mb-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border accent-[color:var(--accent)]"
          checked={alleErneut}
          onChange={(e) => setAlleErneut(e.target.checked)}
        />
        Alle erneut senden (auch bereits verschickte)
      </label>

      <button
        onClick={alleSenden}
        disabled={sendetAlle || !empfaenger}
        className="rounded-lg bg-accent hover:bg-accent-dark disabled:opacity-60 text-white text-sm font-medium px-4 py-2"
      >
        {sendetAlle
          ? "Sendet …"
          : `Abschluss an ${alleErneut ? empfaenger?.length ?? 0 : nochOffen} Person(en) senden`}
      </button>

      {fehler && <p className="mt-2 text-sm text-danger">{fehler}</p>}
      {ergebnis && <p className="mt-2 text-sm text-accent-dark">{ergebnis}</p>}

      {empfaenger && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-accent-light text-accent-dark text-left">
              <tr>
                <th className="px-2 py-1.5">Name</th>
                <th className="px-2 py-1.5">Betrag</th>
                <th className="px-2 py-1.5">Abschluss-Status</th>
              </tr>
            </thead>
            <tbody>
              {empfaenger.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-2 py-1.5">{e.vorname} {e.nachname}</td>
                  <td className="px-2 py-1.5">{euro(e.betrag)}</td>
                  <td className="px-2 py-1.5">{e.abschlussStatus || "offen"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
