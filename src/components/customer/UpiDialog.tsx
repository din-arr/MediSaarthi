"use client";

import { CheckCircle2, LoaderCircle, QrCode, Smartphone, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Props = { open: boolean; amount: number; orderNumber: string; onClose: () => void; onPay: (body: { upiId?: string; outcome: "success" | "failure" }) => Promise<string | null> };

const merchant = "medisaarthi@testbank";

/**
 * Test-mode UPI checkout. Looks like a real one (QR, UPI ID, app buttons),
 * but nothing is charged: the "bank" answer is simulated.
 */
export default function UpiDialog({ open, amount, orderNumber, onClose, onPay }: Props) {
  const [tab, setTab] = useState<"qr" | "id">("qr");
  const [upiId, setUpiId] = useState("");
  const [stage, setStage] = useState<"choose" | "waiting" | "done">("choose");
  const [error, setError] = useState("");
  const link = `upi://pay?pa=${merchant}&pn=MediSaarthi&am=${amount}&cu=INR&tn=${encodeURIComponent(orderNumber)}`;

  useEffect(() => {
    if (!open) return;
    const reset = window.setTimeout(() => { setStage("choose"); setError(""); }, 0);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.clearTimeout(reset); window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  if (!open) return null;

  const pay = async (outcome: "success" | "failure") => {
    if (tab === "id" && !/^[a-zA-Z0-9._-]{2,64}@[a-zA-Z]{2,32}$/.test(upiId.trim())) { setError("Enter a UPI ID like name@okhdfcbank."); return; }
    setError(""); setStage("waiting");
    await new Promise((resolve) => setTimeout(resolve, 1800)); // the "bank" thinking
    const problem = await onPay({ upiId: tab === "id" ? upiId.trim() : undefined, outcome });
    if (problem) { setError(problem); setStage("choose"); return; }
    setStage("done");
    setTimeout(onClose, 1400);
  };

  return (
    <div className="address-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target && stage !== "waiting") onClose(); }}>
      <section className="address-dialog upi-dialog" role="dialog" aria-modal="true" aria-labelledby="upi-title">
        <div className="dialog-heading">
          <div><p className="eyebrow">Test mode · no real money</p><h2 id="upi-title">Pay ₹{amount} by UPI</h2><p className="muted-small">{orderNumber} · to {merchant}</p></div>
          {stage !== "waiting" && <button className="icon-button" type="button" aria-label="Close" onClick={onClose}><X size={20} /></button>}
        </div>

        {stage === "waiting" && <div className="upi-state"><LoaderCircle className="button-spinner big" /><strong>Waiting for your UPI app…</strong><p className="muted-small">Approve the request in the app. Don&apos;t close this window.</p></div>}
        {stage === "done" && <div className="upi-state ok"><CheckCircle2 size={48} /><strong>Payment successful</strong><p className="muted-small">Your store will start packing now.</p></div>}

        {stage === "choose" && <>
          <div className="seg upi-tabs">
            <button type="button" className={tab === "qr" ? "on" : ""} onClick={() => setTab("qr")}><QrCode size={16} /> Scan QR</button>
            <button type="button" className={tab === "id" ? "on" : ""} onClick={() => setTab("id")}><Smartphone size={16} /> UPI ID</button>
          </div>

          {tab === "qr" ? (
            <div className="upi-qr-wrap">
              <FakeQr seed={orderNumber + amount} />
              <p className="muted-small">Scan with any UPI app. This is a test QR, so scanning it won&apos;t charge you.</p>
              <div className="upi-apps">{["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => <a key={app} className="secondary-button" href={link} onClick={(event) => { event.preventDefault(); void pay("success"); }}>{app}</a>)}</div>
            </div>
          ) : (
            <label className="field-label">Your UPI ID<input className="text-input" placeholder="name@okhdfcbank" value={upiId} autoFocus onChange={(event) => setUpiId(event.target.value)} /><small className="muted-small">We&apos;ll send a payment request to this ID.</small></label>
          )}

          {error && <p className="form-error">{error}</p>}
          <button className="auth-primary" type="button" onClick={() => pay("success")}>{tab === "qr" ? "I've paid" : `Send request for ₹${amount}`}</button>
          <button className="text-button upi-fail" type="button" onClick={() => pay("failure")}>Test a failed payment</button>
        </>}
      </section>
    </div>
  );
}

/** Draws a QR-style pattern (deterministic per order). Not scannable, on purpose. */
function FakeQr({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let hash = 0;
    for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    const size = 25;
    const grid: boolean[] = [];
    for (let i = 0; i < size * size; i += 1) { hash = (hash * 1103515245 + 12345) >>> 0; grid.push((hash >> 16) % 2 === 0); }
    return { size, grid };
  }, [seed]);
  const finder = (x: number, y: number) => <g key={`${x}-${y}`}><rect x={x} y={y} width="7" height="7" fill="#0f172a" /><rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" /><rect x={x + 2} y={y + 2} width="3" height="3" fill="#0f172a" /></g>;
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16);
  return (
    <svg className="upi-qr" viewBox="-2 -2 29 29" role="img" aria-label="Test UPI QR code">
      <rect x="-2" y="-2" width="29" height="29" fill="#fff" rx="1.5" />
      {cells.grid.map((on, index) => { const x = index % cells.size; const y = Math.floor(index / cells.size); return on && !inFinder(x, y) ? <rect key={index} x={x} y={y} width="1" height="1" fill="#0f172a" /> : null; })}
      {finder(0, 0)}{finder(18, 0)}{finder(0, 18)}
    </svg>
  );
}
