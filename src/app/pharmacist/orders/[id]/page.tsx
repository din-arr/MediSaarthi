"use client";

import type { Role } from "../../../../lib/session";

import { ArrowLeft, Check, LoaderCircle, Lock, Maximize2, Pencil, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, Suspense } from "react";
import PharmacistHeader, { ScheduleBadge } from "../../../../components/pharmacist/PharmacistHeader";
import { useStaffText } from "../../../../components/pharmacist/useStaffText";

type Item = { id: string; productId: string; name: string; strength: string; packSize: string; schedule: string; quantity: number; originalQty: number | null; approvalStatus: "PENDING" | "APPROVED" | "EDITED" | "REJECTED"; rejectReason: string | null; confidence: number | null; otherStrengths: Array<{ id: string; strength: string; packSize: string }>; price: number; consentStatus: string; generic: { name: string; strength: string; price: number } | null };
type Order = { id: string; number: string; status: string; createdAt: string; decisionReason: string | null; customer: { name: string; phone: string }; patient: { name: string; relation: string }; address: string; store: string | null; prescription: { id: string; doctorName: string; doctorRegNo: string; issuedOn: string | null; uploadedAt: string } | null; items: Item[]; audit: Array<{ action: string; by: string; at: string }> };

const rejectReasons = ["Not on the prescription", "Unreadable", "Prescription expired", "Wrong strength", "Quantity too high", "Other"];

// The order id comes from the URL, so the page renders inside Suspense (needed with cacheComponents).
export default function VerifyOrderPage() {
  return <Suspense fallback={null}><VerifyOrder /></Suspense>;
}

function VerifyOrder() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [me, setMe] = useState<{ name: string; role?: Role; user?: { registrationNumber?: string | null } } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [active, setActive] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState(rejectReasons[0]);
  const [note, setNote] = useState("");
  const [doctor, setDoctor] = useState({ name: "", regNo: "", issuedOn: "", patientAddress: "" });
  const [doses, setDoses] = useState<Record<string, string>>({});
  const [orderAction, setOrderAction] = useState<"reupload" | "reject" | null>(null);
  const [orderReason, setOrderReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const s = useStaffText();

  const load = useCallback(async () => {
    const response = await fetch(`/api/pharmacist/orders/${id}`).catch(() => null);
    if (!response?.ok) { setError("Couldn't load this order."); return; }
    const value = await response.json() as Order;
    setOrder(value);
    setDoctor((current) => current.name || current.regNo ? current : { name: value.prescription?.doctorName ?? "", regNo: value.prescription?.doctorRegNo ?? "", issuedOn: value.prescription?.issuedOn?.slice(0, 10) ?? "", patientAddress: value.address });
  }, [id]);

  useEffect(() => {
    fetch("/api/auth/session").then((response) => response.ok ? response.json() : null).then(setMe);
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const decide = useCallback(async (item: Item, body: Record<string, unknown>) => {
    setError("");
    const response = await fetch(`/api/pharmacist/orders/${id}/items/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) { setError(result.error); return; }
    setEditing(null); setRejecting(null); setNote("");
    await load();
  }, [id, load]);

  // Keyboard shortcuts: A approve, R reject, arrows move between items.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!order || (event.target as HTMLElement).closest("input, select, textarea")) return;
      const item = order.items[active];
      if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => Math.min(value + 1, order.items.length - 1)); }
      if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
      if (item && event.key.toLowerCase() === "a") void decide(item, { decision: "APPROVED" });
      if (item && event.key.toLowerCase() === "r") setRejecting(item.id);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [order, active, decide]);

  const finish = async (action: "approve" | "reupload" | "reject") => {
    setBusy(true); setError("");
    const response = await fetch(`/api/pharmacist/orders/${id}/decision`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, reason: action === "approve" ? "" : orderReason, doctorName: doctor.name, doctorRegNo: doctor.regNo, issuedOn: doctor.issuedOn, patientAddress: doctor.patientAddress, doses: Object.fromEntries(Object.entries(doses).map(([key, value]) => [key, Number(value)])) }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) { setError(result.error); return; }
    router.push("/pharmacist/queue");
  };

  if (!order) return <main className="customer-home"><PharmacistHeader /><div className="customer-content page-content">{error ? <p className="form-error">{s(error)}</p> : <div className="home-skeleton"><span /><span /></div>}</div></main>;

  const open = ["AWAITING_PHARMACIST", "PARTIAL"].includes(order.status);
  const allDecided = order.items.every((item) => item.approvalStatus !== "PENDING");
  const needsRx = order.items.some((item) => item.approvalStatus !== "REJECTED" && (item.schedule === "H" || item.schedule === "H1"));
  const needsH1 = order.items.some((item) => item.approvalStatus !== "REJECTED" && item.schedule === "H1");
  const rxReady = !needsRx || (doctor.name.trim() && doctor.regNo.trim() && doctor.issuedOn);
  const h1Ready = !needsH1 || doctor.patientAddress.trim();
  const keptCount = order.items.filter((item) => item.approvalStatus !== "REJECTED").length;

  return (
    <main className="customer-home">
      <PharmacistHeader name={me?.name} regNo={me?.user?.registrationNumber} role={me?.role} />
      <div className="customer-content page-content">
        <Link className="back-link" href="/pharmacist/queue"><ArrowLeft size={17} /> {s("Queue")}</Link>
        <div className="page-heading">
          <div><h1>{order.number}</h1><p>{order.patient.name} ({s(order.patient.relation)}) · {s("ordered by {name}", { name: order.customer.name })} · {order.store ?? s("Store not assigned")}</p></div>
          <span className={`status-pill ${open ? "pending" : order.status === "REJECTED" ? "rejected" : "approved"}`}>{s(order.status.replaceAll("_", " ").toLowerCase())}</span>
        </div>

        <div className="ph-verify">
          <section className="ph-viewer">
            <div className="ph-viewer-tools">
              <button className="icon-button" type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}><ZoomOut size={18} /></button>
              <span>{Math.round(zoom * 100)}%</span>
              <button className="icon-button" type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(3, value + 0.25))}><ZoomIn size={18} /></button>
              <button className="icon-button" type="button" aria-label="Rotate" onClick={() => setRotate((value) => (value + 90) % 360)}><RotateCw size={18} /></button>
              <button className="icon-button" type="button" aria-label="Fit" onClick={() => { setZoom(1); setRotate(0); }}><Maximize2 size={18} /></button>
              <span className="ph-logged"><Lock size={14} /> {s("Access is logged")}</span>
            </div>
            <div className="ph-image-frame">
              {order.prescription ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/pharmacist/prescriptions/${order.prescription.id}/file`} alt="Uploaded prescription" style={{ transform: `scale(${zoom}) rotate(${rotate}deg)` }} />
              ) : <p className="empty-copy">{s("No prescription uploaded. Only OTC items can be approved.")}</p>}
            </div>
          </section>

          <section className="ph-panel">
            <div className="ph-card">
              <h2>{s("Prescription details")}</h2>
              <p className="muted-small">{s("Check these against the image. Required for Schedule H and H1.")}</p>
              <div className="ph-grid-2">
                <label className="field-label">{s("Doctor's name")}<input className="text-input" value={doctor.name} disabled={!open} onChange={(event) => setDoctor({ ...doctor, name: event.target.value })} placeholder="Dr. S. Banerjee" /></label>
                <label className="field-label">{s("Registration no.")}<input className="text-input" value={doctor.regNo} disabled={!open} onChange={(event) => setDoctor({ ...doctor, regNo: event.target.value })} placeholder="WBMC 48213" /></label>
                <label className="field-label">{s("Date on prescription")}<input className="text-input" type="date" value={doctor.issuedOn} disabled={!open} onChange={(event) => setDoctor({ ...doctor, issuedOn: event.target.value })} /></label>
                {needsH1 && <label className="field-label">{s("Patient address (H1 register)")}<input className="text-input" value={doctor.patientAddress} disabled={!open} onChange={(event) => setDoctor({ ...doctor, patientAddress: event.target.value })} /></label>}
              </div>
            </div>

            <div className="ph-card">
              <div className="section-heading"><h2>{s("Items")} <small className="muted-small">{s("AI draft, check each one")}</small></h2><span className="muted-small">{s("A approve · R reject · ↑↓ move")}</span></div>
              <ul className="ph-items">
                {order.items.map((item, index) => (
                  <li key={item.id} className={`ph-item ${index === active ? "active" : ""} ${item.approvalStatus.toLowerCase()}`} onClick={() => setActive(index)}>
                    <div className="ph-item-main">
                      <div>
                        <strong>{item.name} {item.strength}</strong> <ScheduleBadge schedule={item.schedule} />
                        <small>{item.quantity} × {item.packSize}{item.originalQty ? ` ${s("(customer asked for {n})", { n: item.originalQty })}` : ""}{item.confidence != null ? ` · AI ${Math.round(item.confidence * 100)}%` : ""}</small>
                        {item.confidence != null && item.confidence < 0.8 && <small className="ph-low">{s("Low confidence. Read the image carefully.")}</small>}
                        {item.rejectReason && <small className="ph-reject-note">{s("Rejected: {reason}", { reason: s(item.rejectReason) })}</small>}
                        {item.consentStatus === "PENDING" && <small className="ph-low">{s("Generic offered. Waiting for the customer to accept.")}</small>}
                        {item.consentStatus === "ACCEPTED" && <small className="ok-note">{s("Customer accepted the generic")}</small>}
                        {item.consentStatus === "DECLINED" && <small className="muted-small">{s("Customer kept the original brand")}</small>}
                        {open && item.generic && item.consentStatus === "NONE" && item.approvalStatus !== "REJECTED" && (
                          <button className="generic-offer" type="button" onClick={(event) => { event.stopPropagation(); void decide(item, { offerGeneric: true }); }}>
                            {s("Offer generic:")} {item.generic.name} {item.generic.strength} · ₹{item.generic.price} <b>{s("(saves ₹{n})", { n: (item.price - item.generic.price) * item.quantity })}</b>
                          </button>
                        )}
                      </div>
                      {open && (
                        <div className="ph-item-actions">
                          <button className={`ph-act ok ${item.approvalStatus === "APPROVED" || item.approvalStatus === "EDITED" ? "on" : ""}`} type="button" onClick={() => decide(item, { decision: "APPROVED" })}><Check size={16} /> {s("Approve")}</button>
                          <button className="ph-act" type="button" onClick={() => setEditing(editing === item.id ? null : item.id)}><Pencil size={15} /> {s("Edit")}</button>
                          <button className={`ph-act no ${item.approvalStatus === "REJECTED" ? "on" : ""}`} type="button" onClick={() => setRejecting(rejecting === item.id ? null : item.id)}><X size={16} /> {s("Reject")}</button>
                        </div>
                      )}
                    </div>
                    {editing === item.id && <EditItem item={item} onSave={(body) => decide(item, { decision: "APPROVED", ...body })} />}
                    {rejecting === item.id && (
                      <div className="ph-inline-form">
                        <select className="text-input" value={reason} onChange={(event) => setReason(event.target.value)}>{rejectReasons.map((value) => <option key={value} value={value}>{s(value)}</option>)}</select>
                        {reason === "Other" && <input className="text-input" placeholder={s("Reason for the customer")} value={note} onChange={(event) => setNote(event.target.value)} />}
                        <button className="ph-act no on" type="button" onClick={() => decide(item, { decision: "REJECTED", reason: reason === "Other" ? note : reason })}>{s("Confirm reject")}</button>
                      </div>
                    )}
                    {open && item.approvalStatus !== "REJECTED" && (
                      <label className="ph-dose">{s("Tablets per day")} <input type="number" min="0" step="0.5" className="text-input" value={doses[item.id] ?? ""} placeholder="e.g. 2" onChange={(event) => setDoses({ ...doses, [item.id]: event.target.value })} /><small>{s("Used for the refill reminder")}</small></label>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {error && <p className="form-error">{error}</p>}

            {open ? (
              <div className="ph-card ph-finish">
                {orderAction ? (
                  <>
                    <label className="field-label">{orderAction === "reupload" ? s("What should the customer fix?") : s("Why is this order rejected?")}<textarea className="text-input" rows={3} value={orderReason} onChange={(event) => setOrderReason(event.target.value)} placeholder={orderAction === "reupload" ? s("The photo is blurred. Please upload a clearer photo of the whole prescription.") : ""} /></label>
                    <div className="dialog-actions"><button className="secondary-button" type="button" onClick={() => setOrderAction(null)}>{s("Cancel")}</button><button className="danger-button" type="button" disabled={busy || !orderReason.trim()} onClick={() => finish(orderAction)}>{orderAction === "reupload" ? s("Ask for re-upload") : s("Reject order")}</button></div>
                  </>
                ) : (
                  <>
                    <button className="auth-primary" type="button" disabled={busy || !allDecided || !rxReady || !h1Ready || keptCount === 0} onClick={() => finish("approve")}>{busy ? <LoaderCircle className="button-spinner" /> : s(keptCount === 1 ? "Approve order ({n} item)" : "Approve order ({n} items)", { n: keptCount })}</button>
                    {!allDecided && <p className="muted-small">{s("Decide every item to approve the order.")}</p>}
                    {allDecided && !rxReady && <p className="muted-small">{s("Fill in the doctor's details above.")}</p>}
                    {allDecided && rxReady && !h1Ready && <p className="muted-small">{s("Add the patient's address for the H1 register.")}</p>}
                    <div className="ph-secondary-actions"><button className="secondary-button" type="button" onClick={() => setOrderAction("reupload")}>{s("Request re-upload")}</button><button className="secondary-button danger-text" type="button" onClick={() => setOrderAction("reject")}>{s("Reject order")}</button></div>
                  </>
                )}
              </div>
            ) : order.decisionReason && <p className="ph-card">{s("Reason given: {reason}", { reason: order.decisionReason })}</p>}

            {order.audit.length > 0 && (
              <details className="ph-card"><summary>{s("History")}</summary><ul className="ph-audit">{order.audit.map((log, index) => <li key={index}><strong>{s(log.action.replaceAll("_", " ").toLowerCase())}</strong> {s("by {name}", { name: log.by })} · {new Date(log.at).toLocaleString()}</li>)}</ul></details>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function EditItem({ item, onSave }: { item: Item; onSave: (body: { quantity: number; productId: string }) => void }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [productId, setProductId] = useState(item.productId);
  const s = useStaffText();
  return (
    <div className="ph-inline-form">
      <select className="text-input" value={productId} onChange={(event) => setProductId(event.target.value)}>
        <option value={item.productId}>{item.strength} · {item.packSize}</option>
        {item.otherStrengths.map((option) => <option key={option.id} value={option.id}>{option.strength} · {option.packSize}</option>)}
      </select>
      <div className="stepper"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><span>{quantity}</span><button type="button" onClick={() => setQuantity(Math.min(30, quantity + 1))}>+</button></div>
      <button className="ph-act ok on" type="button" onClick={() => onSave({ quantity, productId })}>{s("Save and approve")}</button>
    </div>
  );
}
