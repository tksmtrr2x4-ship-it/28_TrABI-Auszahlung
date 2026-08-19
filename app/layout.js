import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ORG_NAME } from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: `Auszahlung Stufenkasse – ${ORG_NAME}`,
  description: "Rückmeldung zur Auszahlung deines Anteils an der Stufenkasse",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
