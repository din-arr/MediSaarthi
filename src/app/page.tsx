"use client";

import { Moon, Sun, HeartPulse } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import LanguageSwitcher from "../components/LanguageSwitcher";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  return (
    <button
      type="button"
      aria-label="Toggle colour theme"
      className="icon-button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {mounted ? (resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />) : <span className="icon-placeholder" />}
    </button>
  );
}

function Logo() {
  return (
    <a href="#top" className="logo" aria-label="MediSaarthi home">
      <span className="logo-mark"><HeartPulse size={21} /></span>
      <span>Medi<span className="logo-accent">Saarthi</span></span>
    </a>
  );
}

export default function Home() {
  return (
    <div id="top" className="site-shell">
      <header className="site-header">
        <Logo />
        <div className="header-actions">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="landing-main">
        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">MediSaarthi · Kolkata</p>
          <h1 id="hero-title">Medicine reordering, made simple.</h1>
          <p className="hero-description">
            Reorder your family&apos;s monthly medicines in under a minute, with a pharmacist checking every prescription.
          </p>
          <a className="primary-button" href="#login">Log in to reorder</a>
        </section>

        <section className="trust-list" aria-label="Why MediSaarthi">
          <article className="trust-point">
            <span className="trust-number">01</span>
            <div><h2>Pharmacist checks every prescription</h2><p>Every prescription medicine is reviewed before it is packed.</p></div>
          </article>
          <article className="trust-point">
            <span className="trust-number">02</span>
            <div><h2>Same-day from your nearest store</h2><p>We find stock at the closest of our Kolkata and Howrah stores.</p></div>
          </article>
          <article className="trust-point">
            <span className="trust-number">03</span>
            <div><h2>Reminders before you run out</h2><p>Simple refill reminders help keep your routine on track.</p></div>
          </article>
        </section>
      </main>

      <footer className="site-footer">
        <span>MediSaarthi</span>
        <span>Independent educational demo · No real orders or medical records</span>
      </footer>
    </div>
  );
}
