"use client";

import { Moon, Sun, HeartPulse } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../components/LanguageProvider";

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
  const { t } = useLanguage();

  return (
    <div id="top" className="site-shell">
      <header className="site-header">
        <Logo />
        <div className="header-actions">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link className="header-login" href="/login">{t.landing.headerLogin}</Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">{t.landing.eyebrow}</p>
          <h1 id="hero-title">{t.landing.title}</h1>
          <p className="hero-description">{t.landing.description}</p>
          <Link className="primary-button" href="/login">{t.landing.getStarted}</Link>
          <Link className="landing-login-link" href="/login">{t.landing.existingCustomer}</Link>
        </section>

        <section className="trust-list" aria-label={t.landing.trustLabel}>
          {t.landing.trust.map((point, index) => <article className="trust-point" key={point.title}>
            <span className="trust-number">0{index + 1}</span>
            <div><h2>{point.title}</h2><p>{point.description}</p></div>
          </article>)}
        </section>
      </main>

      <footer className="site-footer">
        <span>MediSaarthi</span>
        <span>{t.landing.disclaimer}</span>
      </footer>
    </div>
  );
}
