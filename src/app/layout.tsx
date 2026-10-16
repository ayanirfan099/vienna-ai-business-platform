import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FORM & FADE — Barber Atelier in Wien",
  description: "Präzise Schnitte, gute Gespräche. Buche deinen Termin im FORM & FADE Barber Atelier im 7. Bezirk in Wien.",
  metadataBase: new URL("https://formandfade.example"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
