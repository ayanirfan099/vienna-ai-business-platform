import { ArrowDown, ArrowRight, Instagram, MapPin, Menu, Scissors } from "lucide-react";
import { business, services } from "@/lib/business";
import { BookingForm } from "@/app/booking/BookingForm";

const nav = [
  ["Leistungen", "#leistungen"],
  ["Unser Atelier", "#atelier"],
  ["Kontakt", "#kontakt"],
];

export default function Home() {
  return (
    <main>
      <a className="skip-link" href="#main-content">Zum Inhalt springen</a>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Form & Fade — Startseite">
          <span className="wordmark-icon"><Scissors size={19} strokeWidth={1.6} /></span>
          <span>FORM <i>&</i> FADE</span>
        </a>
        <nav className="desktop-nav" aria-label="Hauptnavigation">
          {nav.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <a className="header-book" href={business.bookingUrl}>Termin buchen <ArrowRight size={15} /></a>
        <details className="mobile-menu-wrap">
          <summary className="mobile-menu" aria-label="Menü öffnen"><Menu size={21} /></summary>
          <nav className="mobile-nav" aria-label="Mobile Navigation">{nav.map(([label, href]) => <a key={href} href={href}>{label}</a>)}<a href={business.bookingUrl}>Termin buchen</a></nav>
        </details>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy" id="main-content">
          <p className="eyebrow"><span className="eyebrow-line" /> BARBER ATELIER · WIEN VII</p>
          <h1 id="hero-title">Guter Schnitt.<br /><em>Gutes Gefühl.</em></h1>
          <p className="hero-lede">Ein ruhiger Platz für präzises Handwerk und eine kleine Pause vom Alltag. Mitten in Neubau.</p>
          <div className="hero-actions">
            <a className="button button-dark" href={business.bookingUrl}>Termin vereinbaren <ArrowRight size={16} /></a>
            <a className="text-link" href="#leistungen">Unser Angebot <ArrowDown size={14} /></a>
          </div>
          <div className="hero-note"><span className="open-dot" /> DI–SA FÜR DICH DA <span className="note-divider">/</span> NEUBaugASSE 28</div>
        </div>
        <div className="hero-art" aria-label="Abstraktes Ateliermotiv mit warmem Licht und Barberstuhl" role="img">
          <div className="art-frame">
            <div className="art-window" />
            <div className="art-shelf"><span /><span /><span /><span /></div>
            <div className="art-mirror"><div className="mirror-glow" /></div>
            <div className="art-stool"><div className="stool-head" /><div className="stool-back" /><div className="stool-seat" /><div className="stool-post" /><div className="stool-base" /></div>
            <div className="art-plant"><i /><i /><i /><i /><i /><span /></div>
            <div className="art-caption"><span>01 — 48°12&apos; N</span><span>WIEN, NEUBAU</span></div>
          </div>
          <div className="art-index">EST.<br /><b>2018</b></div>
        </div>
        <span className="hero-side-label">HANDWERK MIT HALTUNG — SEIT 2018</span>
      </section>

      <section className="intro-strip" aria-label="Unser Versprechen">
        <span>GUTER STIL IST PERSÖNLICH.</span><span className="intro-star">✳</span><span>WIR NEHMEN UNS ZEIT.</span><span className="intro-star">✳</span><span>WIEN, 1070.</span>
      </section>

      <section className="services-section section-wrap" id="leistungen">
        <div className="section-heading">
          <div><p className="eyebrow"><span className="eyebrow-line" /> KLAR IM STIL. SAUBER IM DETAIL.</p><h2>Was wir <em>machen.</em></h2></div>
          <p>Kein Schnickschnack. Gute Beratung, ein sicherer Griff und ein Ergebnis, das sich nach dir anfühlt.</p>
        </div>
        <div className="service-list">
          {services.map((service, index) => (
            <a className="service-row" key={service.name} href={business.bookingUrl}>
              <span className="service-number">0{index + 1}</span><span className="service-info"><b>{service.name}</b><small>{service.detail}</small></span><span className="service-duration">{service.duration}</span><span className="service-price">{service.price}</span><ArrowRight className="service-arrow" size={18} />
            </a>
          ))}
        </div>
        <div className="service-footnote">ALLE PREISE INKL. BERATUNG & STYLING <span>—</span> WIR FREUEN UNS AUF DICH.</div>
      </section>

      <section className="atelier-section" id="atelier">
        <div className="atelier-image" role="img" aria-label="Warme, ruhige Atmosphäre im Barber Atelier">
          <span className="image-stamp">FORM<br />& FADE</span>
          <div className="atelier-chair"><div /><i /><b /><span /></div>
          <div className="atelier-sun" />
          <span className="atelier-image-note">UNSER PLATZ IN NEUBAU · 01</span>
        </div>
        <div className="atelier-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> EIN GUTER ORT FÜR GUTE HAARE</p>
          <h2>Ein bisschen<br />weniger <em>müssen.</em></h2>
          <p>Bei uns geht&rsquo;s nicht nur um den Schnitt. Es geht um die Zeit dazwischen: ankommen, durchatmen, einen Kaffee trinken. Und mit einem guten Gefühl wieder rausgehen.</p>
          <a className="text-link" href="#kontakt">Lern uns kennen <ArrowRight size={15} /></a>
          <div className="atelier-signature">GUTE HÄNDE. GUTE LEUTE. GUTE ZEITEN.<span>FORM & FADE, WIEN</span></div>
        </div>
      </section>

      <section className="booking-section" id="booking">
        <div className="booking-grain" />
        <p className="eyebrow"><span className="eyebrow-line" /> DEIN STUHL IST FREI</p>
        <h2>Bereit für<br /><em>einen guten Schnitt?</em></h2>
        <p>Such dir Leistung, Zeit und Barber aus. Wir freuen uns auf dich.</p>
        <BookingForm />
        <a className="booking-phone" href="tel:+4315231809">Lieber telefonisch? +43 1 523 18 09 <ArrowRight size={14} /></a>
        <span className="booking-small">DI–SA <i>·</i> NEUBAUGASSE 28, 1070 WIEN</span>
      </section>

      <footer className="site-footer" id="kontakt">
        <div className="footer-top">
          <div><a className="wordmark footer-logo" href="#top"><span className="wordmark-icon"><Scissors size={19} strokeWidth={1.6} /></span><span>FORM <i>&</i> FADE</span></a><p className="footer-tagline">Guter Schnitt. Gutes Gefühl.<br />Dein Barber Atelier in Wien.</p></div>
          <div className="footer-col"><span className="footer-label">HIER FINDEST DU UNS</span><a href="https://maps.google.com/?q=Neubaugasse+28+1070+Wien" target="_blank" rel="noreferrer">{business.address}<br />Österreich <MapPin size={13} /></a><a href="tel:+4315231809">{business.phone}</a></div>
          <div className="footer-col"><span className="footer-label">ÖFFNUNGSZEITEN</span>{business.hours.map((hours) => <span key={hours}>{hours}</span>)}</div>
          <div className="footer-col"><span className="footer-label">FOLG UNS</span><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram <Instagram size={14} /></a><a href="#kontakt">Kontakt</a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 FORM & FADE · FIKTIVES DEMO-BUSINESS</span><div><a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a></div><span>MIT LIEBE IN WIEN GEMACHT</span></div>
      </footer>
    </main>
  );
}
