import {
  ORG_NAME,
  CONTACT_EMAIL,
  FORM_OPEN,
  FORM_CLOSE,
  formularPhase,
  formatDeadline,
} from "@/lib/config";
import UmfrageForm from "./UmfrageForm";

export const dynamic = "force-dynamic";

export default function Home() {
  const phase = formularPhase();

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-xl">
        <header className="mb-8 text-center">
          <p className="inline-block rounded-full bg-accent-light text-accent-dark text-xs font-semibold tracking-wide uppercase px-3 py-1 mb-4">
            {ORG_NAME} · Stufenkasse
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Auszahlung deines Anteils
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            Kurze Rückmeldung, ob du dir deinen Anteil an der Stufenkasse
            auszahlen lassen möchtest.
          </p>
        </header>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-8">
          {phase === "vor" && (
            <StatusMessage
              title="Die Umfrage ist noch nicht geöffnet"
              text={`Das Formular öffnet am ${formatDeadline(FORM_OPEN)}. Schau danach noch einmal über den Link in der Gruppe vorbei.`}
            />
          )}

          {phase === "nach" && (
            <StatusMessage
              title="Die Frist ist abgelaufen"
              text={`Die Rückmeldefrist endete am ${formatDeadline(FORM_CLOSE)}. Falls du dich noch nicht gemeldet hast, wende dich bitte direkt an uns.`}
            />
          )}

          {phase === "offen" && <UmfrageForm deadline={formatDeadline(FORM_CLOSE)} />}
        </div>

        <footer className="mt-6 text-center text-xs text-foreground/50">
          Fragen? Schreib uns an{" "}
          <a className="underline hover:text-accent" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </footer>
      </div>
    </main>
  );
}

function StatusMessage({ title, text }) {
  return (
    <div className="text-center py-6">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-sm text-foreground/70 leading-relaxed">{text}</p>
    </div>
  );
}
