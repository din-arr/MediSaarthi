"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLanguage } from "../LanguageProvider";

const steps = ["AWAITING_PHARMACIST", "APPROVED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
const labels = ["awaitingPharmacist", "approved", "packed", "outForDelivery", "delivered"] as const;

export default function OrderTimeline({ status }: { status: string }) {
  const { t } = useLanguage();
  const reduced = useReducedMotion();
  const rejected = status === "REJECTED" || status === "REUPLOAD_REQUESTED";
  const currentIndex = status === "PARTIAL" ? 0 : steps.indexOf(status as typeof steps[number]);
  return <div className={`order-timeline ${rejected ? "timeline-rejected" : ""}`}>{steps.map((step, index) => {
    const complete = !rejected && currentIndex >= index;
    const current = currentIndex === index;
    return <motion.div className={`${complete ? "complete" : ""} ${current ? "current" : ""}`} key={step} initial={reduced ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : index * .04 }}><span />{t.dashboard[labels[index]]}</motion.div>;
  })}</div>;
}

export function OrderStatusPill({ status }: { status: string }) {
  const { t } = useLanguage();
  const text: Record<string, string> = { AWAITING_PHARMACIST: t.dashboard.awaitingPharmacist, REUPLOAD_REQUESTED: t.dashboard.reuploadRequested, APPROVED: t.dashboard.approved, REJECTED: t.dashboard.rejected, PARTIAL: t.dashboard.partial, PACKED: t.dashboard.packed, OUT_FOR_DELIVERY: t.dashboard.outForDelivery, DELIVERED: t.dashboard.delivered, DRAFT: t.dashboard.draft };
  const tone = status === "REJECTED" ? "red" : status === "AWAITING_PHARMACIST" || status === "REUPLOAD_REQUESTED" || status === "PARTIAL" ? "amber" : "green";
  return <span className={`status-pill ${tone}`}>{text[status] ?? t.dashboard.awaitingPharmacist}</span>;
}
