import Link from "next/link";
import { ORG_NAME } from "@/lib/config";
import AgbInhalt from "../AgbInhalt";

export const metadata = {
  title: `AGB Auszahlungsprogramm – ${ORG_NAME}`,
};

export default function AgbPage() {
  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-xl">
        <header className="mb-8">
          <p className="inline-block rounded-full bg-accent-light text-accent-dark text-xs font-semibold tracking-wide uppercase px-3 py-1 mb-4">
            {ORG_NAME} · Stufenkasse
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Allgemeine Bedingungen für das Auszahlungsprogramm
          </h1>
          <Link href="/" className="text-sm text-accent hover:underline">
            ← zurück zum Formular
          </Link>
        </header>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-8">
          <AgbInhalt />
        </div>
      </div>
    </main>
  );
}
