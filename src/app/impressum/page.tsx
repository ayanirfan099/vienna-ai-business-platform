import Link from "next/link";

export default function ImpressumPage() {
  return <main className="legal-page"><Link href="/" className="legal-back">← FORM & FADE</Link><p className="eyebrow"><span className="eyebrow-line" /> RECHTLICHE INFORMATIONEN</p><h1>Impressum</h1><p className="legal-notice">Platzhalter für ein fiktives Demo-Business. Vor einem echten Betrieb müssen die folgenden Angaben durch vollständige und geprüfte Unternehmensdaten ersetzt werden.</p><h2>Medieninhaber und Diensteanbieter</h2><p>FORM & FADE GmbH (fiktiv)<br />Neubaugasse 28, 1070 Wien, Österreich<br />Firmenbuchnummer: [eintragen] · Firmenbuchgericht: [eintragen]<br />UID-Nummer: [eintragen]</p><h2>Kontakt</h2><p>Telefon: +43 1 523 18 09<br />E-Mail: [geschäftliche E-Mail-Adresse eintragen]</p><h2>Aufsichtsbehörde und Berufsrecht</h2><p>[Zuständige Behörde, Kammer und anwendbare berufsrechtliche Vorschriften ergänzen.]</p><Link className="text-link" href="/">Zurück zur Startseite →</Link></main>;
}
