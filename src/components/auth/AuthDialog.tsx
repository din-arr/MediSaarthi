"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, CheckCircle2, CircleAlert, KeyRound, LoaderCircle, Phone, UserRound, X } from "lucide-react";
import { FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../LanguageProvider";

type Props = { open: boolean; onClose: () => void };
type Step = 1 | 2 | 3;
type Relation = "Mother" | "Father" | "Spouse" | "Child" | "Other";

export default function AuthDialog({ open, onClose }: Props) {
  const { lang, setLang, t } = useLanguage();
  const router = useRouter();
  const reduced = useReducedMotion();
  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [profileLanguage, setProfileLanguage] = useState(lang);
  const [familyName, setFamilyName] = useState("");
  const [relation, setRelation] = useState<Relation | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Array<{ name: string; relation: Relation }>>([]);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [demoCode, setDemoCode] = useState("");
  const [resendSeconds, setResendSeconds] = useState(30);
  const phoneRef = useRef<HTMLInputElement>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => (step === 1 ? phoneRef.current : otpRefs.current[0])?.focus(), 100);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button, input, select, [tabindex]:not([tabindex='-1'])");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { window.clearTimeout(timer); document.body.style.overflow = ""; document.removeEventListener("keydown", onKeyDown); };
  }, [open, onClose, step]);

  useEffect(() => {
    if (step !== 2 || resendSeconds === 0) return;
    const timer = window.setInterval(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [step, resendSeconds]);

  const reset = () => { setStep(1); setPhone(""); setOtp(["", "", "", "", "", ""]); setName(""); setFamilyName(""); setRelation(null); setFamilyMembers([]); setConsent(false); setError(""); setSuccess(false); setDemoCode(""); };
  const close = () => { reset(); onClose(); };
  const continuePhone = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{10}$/.test(phone)) { setError(t.auth.phoneInvalid); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/auth/otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) });
      const result = await response.json() as { demoCode?: string; error?: string };
      if (!response.ok) throw new Error(result.error);
      setDemoCode(result.demoCode ?? ""); setResendSeconds(30); setStep(2);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : t.auth.loginError); } finally { setLoading(false); }
  };
  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (otp.join("").length !== 6) { setError(t.auth.otpInvalid); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, otp: otp.join("") }) });
      const result = await response.json() as { role?: "CUSTOMER" | "PHARMACIST"; needsProfile?: boolean };
      if (!response.ok) throw new Error();
      if (result.needsProfile) setStep(3);
      else { setSuccess(true); window.setTimeout(() => { close(); router.push(result.role === "PHARMACIST" ? "/pharmacist/queue" : "/home"); }, 700); }
    } catch { setError(t.auth.loginError); } finally { setLoading(false); }
  };
  const updateOtp = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      setOtp((current) => current.map((digit, position) => pasted[position] ?? digit));
      otpRefs.current[Math.min(pasted.length, 6) - 1]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return;
    setError(""); setOtp((current) => current.map((digit, position) => position === index ? value : digit));
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const createAccount = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !consent) { setError(t.auth.profileError); return; }
    setLoading(true); setError("");
    try {
      if (relation && !familyName.trim()) { setError(t.auth.familyNameRequired); setLoading(false); return; }
      const members = relation && familyName.trim() ? [...familyMembers, { name: familyName.trim(), relation }] : familyMembers;
      const response = await fetch("/api/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, name: name.trim(), language: profileLanguage, familyMembers: members, consent }) });
      if (!response.ok) throw new Error();
      setSuccess(true); window.setTimeout(() => { close(); router.push("/home"); }, 700);
    } catch { setError(t.auth.loginError); } finally { setLoading(false); }
  };
  const slide = { initial: { opacity: 0, x: reduced ? 0 : 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: reduced ? 0 : -24 } };

  return <AnimatePresence>{open && <motion.div className="auth-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <motion.div ref={dialogRef} className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title" initial={{ opacity: 0, scale: reduced ? 1 : .96, y: reduced ? 0 : 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: reduced ? 1 : .96 }} transition={{ duration: reduced ? 0 : .22 }}>
      <div className="dialog-top-row"><div className="auth-progress" aria-label={`${step} of 3`}>{[1, 2, 3].map((number) => <span className={step >= number ? "active" : ""} key={number} />)}</div><button className="dialog-close" type="button" aria-label="Close" onClick={close}><X size={20} /></button></div>
      <div className="dialog-logo"><span className="logo-mark"><Check size={18} /></span></div>
      <AnimatePresence mode="wait" initial={false}>
        {step === 1 && <motion.form key="one" variants={slide} initial="initial" animate="animate" exit="exit" onSubmit={continuePhone}>
          <DialogHeading id="auth-dialog-title" icon={<Phone size={22} />} title={t.auth.welcomeTitle} subtitle={t.auth.welcomeSubtitle} />
          <label className="sr-only" htmlFor="auth-phone">{t.auth.enterMobile}</label>
          <div className={`phone-input ${error ? "input-error" : ""}`}><span>+91</span><input ref={phoneRef} id="auth-phone" type="tel" inputMode="numeric" maxLength={10} placeholder={t.auth.phonePlaceholder} value={phone} onChange={(event) => { setPhone(event.target.value.replace(/\D/g, "")); setError(""); }} /></div>
          {error && <ErrorMessage message={error} />}
          <button className="auth-primary" disabled={phone.length !== 10 || loading} type="submit">{loading ? <LoaderCircle className="button-spinner" size={20} /> : t.auth.continue}</button>
        </motion.form>}
        {step === 2 && <motion.form key="two" variants={slide} initial="initial" animate="animate" exit="exit" onSubmit={verify}>
          <DialogHeading id="auth-dialog-title" icon={<KeyRound size={22} />} title={`${t.auth.enterCode} +91 ${phone.slice(0, 2)}XXX XXXXX`} subtitle={t.auth.demoNote} />
          {demoCode && <p className="demo-pill">{t.auth.demoMode} · {t.auth.demoNote.replace("Your code is ready", `your code is ${demoCode}`)}</p>}
          <div className={`otp-grid ${error ? "otp-error" : ""}`}>{otp.map((digit, index) => <motion.input key={index} ref={(element) => { otpRefs.current[index] = element; }} aria-label={`${t.auth.otpDigit} ${index + 1}`} type="text" inputMode="numeric" maxLength={6} value={digit} animate={error ? { x: [0, -4, 4, -3, 3, 0] } : { scale: digit ? [1, 1.06, 1] : 1 }} onKeyDown={(event) => { if (event.key === "Backspace" && !digit && index > 0) otpRefs.current[index - 1]?.focus(); }} onChange={(event) => updateOtp(index, event.target.value)} />)}</div>
          {error && <ErrorMessage message={error} />}
          <button className="auth-primary" disabled={loading} type="submit">{loading ? <LoaderCircle className="button-spinner" size={20} /> : success ? <Check size={20} /> : t.auth.verify}</button>
          <div className="auth-links"><button type="button" onClick={() => { setStep(1); setOtp(["", "", "", "", "", ""]); setError(""); }}>{t.auth.changeNumber}</button><button type="button" disabled={resendSeconds > 0} onClick={async () => { const response = await fetch("/api/auth/otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) }); const result = await response.json() as { demoCode?: string; error?: string }; if (response.ok) { setDemoCode(result.demoCode ?? ""); setResendSeconds(30); } else setError(result.error ?? t.auth.loginError); }}>{resendSeconds ? `${t.auth.resendCode} (${resendSeconds}s)` : t.auth.resendCode}</button></div>
        </motion.form>}
        {step === 3 && <motion.form key="three" variants={slide} initial="initial" animate="animate" exit="exit" onSubmit={createAccount}>
          <DialogHeading id="auth-dialog-title" icon={<UserRound size={22} />} title={t.auth.createProfile} subtitle={t.auth.stepThreeSubtitle} />
          <label className="field-label" htmlFor="profile-name">{t.auth.fullName}</label><input className="text-input" id="profile-name" autoFocus value={name} placeholder={t.auth.fullNamePlaceholder} onChange={(event) => setName(event.target.value)} />
          <p className="field-label">{t.auth.preferredLanguage}</p><div className="language-cards">{(["en", "bn", "hi"] as const).map((code) => <button type="button" className={profileLanguage === code ? "language-card selected" : "language-card"} key={code} onClick={() => { setProfileLanguage(code); setLang(code); }}>{code === "en" ? "English" : code === "bn" ? "বাংলা" : "हिन्दी"}{profileLanguage === code && <Check size={16} />}</button>)}</div>
          <p className="field-label family-heading">{t.auth.familyMember} <small>{t.auth.familyMemberOptional}</small></p><div className="relation-chips">{(["Mother", "Father", "Spouse", "Child", "Other"] as Relation[]).map((value) => <button type="button" className={relation === value ? "relation-chip selected" : "relation-chip"} key={value} onClick={() => setRelation((current) => current === value ? null : value)}>{value === "Mother" ? t.auth.relationMother : value === "Father" ? t.auth.relationFather : value === "Spouse" ? t.auth.relationSpouse : value === "Child" ? t.auth.relationChild : t.auth.relationOther}</button>)}</div>{relation && <><label className="field-label" htmlFor="family-name">{t.auth.theirName}</label><input className="text-input" id="family-name" value={familyName} placeholder={t.auth.theirNamePlaceholder} onChange={(event) => setFamilyName(event.target.value)} />{familyMembers.length > 0 && <p className="family-added">{familyMembers.map((member) => `${member.name} · ${member.relation}`).join(", ")}</p>}<button type="button" className="text-button" onClick={() => { if (familyName.trim()) { setFamilyMembers((members) => [...members, { name: familyName.trim(), relation }]); setFamilyName(""); setRelation(null); } }}>{t.auth.addAnother}</button></>}
          <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{t.auth.consent}</span></label>{error && <ErrorMessage message={error} />}<button className="auth-primary" disabled={loading || !name.trim() || !consent} type="submit">{loading ? <LoaderCircle className="button-spinner" size={20} /> : success ? <Check size={20} /> : t.auth.createAccount}</button>
        </motion.form>}
      </AnimatePresence>
      {success && <motion.div className="success-overlay" initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={26} /></motion.div>}
    </motion.div>
  </motion.div>}</AnimatePresence>;
}

function DialogHeading({ id, icon, title, subtitle }: { id: string; icon: ReactNode; title: string; subtitle: string }) {
  return <div className="login-heading"><div className="dialog-step-icon">{icon}</div><h1 id={id}>{title}</h1><p>{subtitle}</p></div>;
}

function ErrorMessage({ message }: { message: string }) {
  return <p className="form-error"><CircleAlert size={16} aria-hidden="true" />{message}</p>;
}
