"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FormEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, CheckCircle2, CircleAlert, LockKeyhole, ShieldCheck, Truck, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useLanguage } from "../../components/LanguageProvider";

type Step = 1 | 2 | 3;
type Relation = "Mother" | "Father" | "Spouse" | "Child" | "Other";

export default function LoginPage() {
  const { lang, setLang, t } = useLanguage();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [profileLanguage, setProfileLanguage] = useState(lang);
  const [familyName, setFamilyName] = useState("");
  const [relation, setRelation] = useState<Relation>("Mother");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(30);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (step !== 2 || resendSeconds === 0) return;
    const timer = window.setInterval(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [step, resendSeconds]);

  const goToPhone = () => {
    setStep(1); setOtp(["", "", "", "", "", ""]); setError(""); setResendSeconds(30);
  };

  const continueWithPhone = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      setError(t.auth.phoneInvalid);
      return;
    }
    setError(""); setResendSeconds(30); setStep(2);
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (otp.join("").length !== 6) {
      setError(t.auth.otpInvalid);
      return;
    }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, otp: otp.join("") }) });
      const result = await response.json() as { role?: "CUSTOMER" | "PHARMACIST"; needsProfile?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error);
      if (result.needsProfile) {
        setStep(3);
        return;
      }
      setSuccess(true);
      window.setTimeout(() => router.push(result.role === "PHARMACIST" ? "/pharmacist/queue" : "/home"), 700);
    } catch {
      setError(t.auth.loginError);
    } finally {
      setLoading(false);
    }
  };

  const updateOtp = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      setOtp((current) => current.map((digit, position) => pasted[position] ?? digit));
      inputs.current[Math.min(pasted.length, 6) - 1]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return;
    setOtp((current) => current.map((digit, position) => position === index ? value : digit));
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, key: string) => {
    if (key === "Backspace" && !otp[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  const createAccount = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !consent) {
      setError(t.auth.profileError);
      return;
    }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, name: name.trim(), language: profileLanguage, familyName: familyName.trim(), relation, consent }) });
      if (!response.ok) throw new Error();
      setSuccess(true);
      window.setTimeout(() => router.push("/home"), 700);
    } catch {
      setError(t.auth.loginError);
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = { initial: { opacity: 0, x: reduceMotion ? 0 : 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: reduceMotion ? 0 : -24 } };

  return <main className="login-page">
    <header className="auth-header">
      <Link href="/" className="logo" aria-label={t.auth.brand}><span className="logo-mark"><ShieldCheck size={21} /></span><span>Medi<span className="logo-accent">Saarthi</span></span></Link>
      <div className="header-actions"><LanguageSwitcher /><ThemeToggle /></div>
    </header>
    <div className="login-layout">
      <aside className="login-reassurance">
        <p className="eyebrow">{t.auth.brand}</p>
        <h2>{t.auth.welcomeTitle}</h2>
        <div className="reassurance-list">
          <Reassurance icon={<ShieldCheck />} text={t.auth.pharmacistChecks} />
          <Reassurance icon={<Truck />} text={t.auth.delivery} />
          <Reassurance icon={<LockKeyhole />} text={t.auth.encrypted} />
        </div>
      </aside>
      <div className="login-column">
        <motion.section className="login-card" initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.45 }} aria-labelledby="login-title">
          <div className="step-indicator" aria-label={`${t.auth.stepOne} · ${t.auth.stepTwo} · ${t.auth.stepThree}`}>
            {[1, 2, 3].map((number) => <span className={step >= number ? "step-active" : ""} key={number}>{number === 1 ? t.auth.stepOne : number === 2 ? t.auth.stepTwo : t.auth.stepThree}</span>)}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {step === 1 && <motion.form key="phone" variants={stepVariants} initial="initial" animate="animate" exit="exit" onSubmit={continueWithPhone}>
              <LoginHeading title={t.auth.welcomeTitle} subtitle={t.auth.welcomeSubtitle} />
              <label className="sr-only" htmlFor="phone">{t.auth.enterMobile}</label>
              <div className={`phone-input ${error ? "input-error" : ""}`}><span>+91</span><input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder={t.auth.phonePlaceholder} value={phone} onChange={(event) => { setPhone(event.target.value.replace(/\D/g, "")); setError(""); }} /></div>
              {error && <ErrorMessage message={error} />}
              <button className="auth-primary" type="submit" disabled={phone.length !== 10}>{t.auth.continue}</button>
            </motion.form>}
            {step === 2 && <motion.form key="otp" variants={stepVariants} initial="initial" animate="animate" exit="exit" onSubmit={verifyOtp}>
              <LoginHeading title={`${t.auth.enterCode} +91 ${phone.slice(0, 2)}XXX XXXXX`} subtitle={t.auth.demoNote} />
              <div className={`otp-grid ${error ? "otp-error" : ""}`}>{otp.map((digit, index) => <motion.input key={index} animate={error ? { x: [0, -4, 4, -3, 3, 0] } : { scale: digit ? [1, 1.06, 1] : 1 }} transition={{ duration: reduceMotion ? 0 : 0.25 }} ref={(element) => { inputs.current[index] = element; }} aria-label={`${t.auth.otpDigit} ${index + 1}`} type="text" inputMode="numeric" maxLength={6} value={digit} onKeyDown={(event) => handleOtpKeyDown(index, event.key)} onChange={(event) => { setError(""); updateOtp(index, event.target.value); }} />)}</div>
              {error && <ErrorMessage message={error} />}
              <button className="auth-primary" type="submit" disabled={loading}>{loading ? <LoaderCircle className="button-spinner" size={20} /> : success ? <Check size={20} /> : t.auth.verify}</button>
              <div className="auth-links"><button type="button" onClick={goToPhone}>{t.auth.changeNumber}</button><button type="button" disabled={resendSeconds > 0} onClick={() => setResendSeconds(30)}>{resendSeconds > 0 ? `${t.auth.resendCode} (${resendSeconds}s)` : t.auth.resendCode}</button></div>
            </motion.form>}
            {step === 3 && <motion.form key="profile" variants={stepVariants} initial="initial" animate="animate" exit="exit" onSubmit={createAccount}>
              <LoginHeading title={t.auth.createProfile} subtitle={t.auth.welcomeSubtitle} />
              <label className="field-label" htmlFor="full-name">{t.auth.fullName}</label>
              <input className="text-input" id="full-name" value={name} placeholder={t.auth.fullNamePlaceholder} onChange={(event) => setName(event.target.value)} />
              <p className="field-label">{t.auth.preferredLanguage}</p>
              <div className="language-cards">{(["en", "bn", "hi"] as const).map((code) => <button type="button" className={profileLanguage === code ? "language-card selected" : "language-card"} key={code} onClick={() => { setProfileLanguage(code); setLang(code); }}><span>{code === "en" ? "English" : code === "bn" ? "বাংলা" : "हिन्दी"}</span>{profileLanguage === code && <Check size={18} />}</button>)}</div>
              <p className="field-label family-heading">{t.auth.familyMember} <span>{t.auth.familyMemberOptional}</span></p>
              <input className="text-input" value={familyName} placeholder={t.auth.familyName} onChange={(event) => setFamilyName(event.target.value)} />
              {familyName && <select className="text-input" value={relation} onChange={(event) => setRelation(event.target.value as Relation)}><option value="Mother">{t.auth.relationMother}</option><option value="Father">{t.auth.relationFather}</option><option value="Spouse">{t.auth.relationSpouse}</option><option value="Child">{t.auth.relationChild}</option><option value="Other">{t.auth.relationOther}</option></select>}
              <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{t.auth.consent}</span></label>
              {error && <ErrorMessage message={error} />}
              <button className="auth-primary" type="submit" disabled={loading || !name.trim() || !consent}>{loading ? <LoaderCircle className="button-spinner" size={20} /> : success ? <Check size={20} /> : t.auth.createAccount}</button>
            </motion.form>}
          </AnimatePresence>
          {success && <motion.div className="success-overlay" initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={26} /></motion.div>}
        </motion.section>
        <p className="login-footer-note">{t.auth.footerSecurity}</p>
      </div>
    </div>
  </main>;
}

function LoginHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="login-heading"><h1 id="login-title">{title}</h1><p>{subtitle}</p></div>;
}

function ErrorMessage({ message }: { message: string }) {
  return <p className="form-error"><CircleAlert size={17} aria-hidden="true" />{message}</p>;
}

function Reassurance({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="reassurance-item"><span>{icon}</span><p>{text}</p></div>;
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  return <button type="button" className="icon-button" aria-label="Toggle colour theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}><span>{mounted ? (resolvedTheme === "dark" ? "☼" : "◐") : <span className="icon-placeholder" />}</span></button>;
}
