/**
 * Schedule rules for MediSaarthi.
 *
 * Every order status change goes through `checkTransition`, on the server.
 * The UI also hides buttons, but this is the check that actually matters.
 */

export type ScheduleCode = "OTC" | "H" | "H1" | "X";
export type ItemDecision = "PENDING" | "APPROVED" | "EDITED" | "REJECTED";
export type Status =
  | "DRAFT" | "AWAITING_PHARMACIST" | "REUPLOAD_REQUESTED" | "APPROVED" | "REJECTED"
  | "PARTIAL" | "PACKED" | "OUT_FOR_DELIVERY" | "DELIVERED";

export type RuleSettings = { prescriptionValidityDays: number; xAllowedOnline: boolean };
export const defaultRules: RuleSettings = { prescriptionValidityDays: 180, xAllowedOnline: false };

export type RuleItem = { schedule: ScheduleCode; approvalStatus: ItemDecision; name?: string; hasH1Entry?: boolean; awaitingConsent?: boolean };
export type RuleOrder = {
  status: Status;
  items: RuleItem[];
  prescription?: { issuedOn?: Date | null; uploadedAt: Date } | null;
  verifiedByRegNo?: string | null;
};

export const needsPrescription = (schedule: ScheduleCode) => schedule === "H" || schedule === "H1";

const allowed: Record<Status, Status[]> = {
  DRAFT: ["AWAITING_PHARMACIST"],
  AWAITING_PHARMACIST: ["APPROVED", "REJECTED", "REUPLOAD_REQUESTED"],
  REUPLOAD_REQUESTED: ["AWAITING_PHARMACIST", "REJECTED"],
  PARTIAL: ["AWAITING_PHARMACIST", "APPROVED", "REJECTED"],
  APPROVED: ["PACKED", "REJECTED"],
  PACKED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  REJECTED: [],
  DELIVERED: [],
};

const releasedStatuses: Status[] = ["APPROVED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];

export function prescriptionExpired(order: RuleOrder, rules: RuleSettings = defaultRules, now = new Date()) {
  if (!order.prescription) return true;
  const issued = order.prescription.issuedOn ?? order.prescription.uploadedAt;
  return now.getTime() - issued.getTime() > rules.prescriptionValidityDays * 86_400_000;
}

/** Returns null when the move is allowed, otherwise a plain-English reason. */
export function checkTransition(order: RuleOrder, to: Status, rules: RuleSettings = defaultRules, now = new Date()): string | null {
  if (!allowed[order.status]?.includes(to)) return `An order can't move from ${order.status} to ${to}.`;
  if (!rules.xAllowedOnline && order.items.some((item) => item.schedule === "X")) return "Schedule X medicines can't be sold online.";
  if (!releasedStatuses.includes(to)) return null;

  const kept = order.items.filter((item) => item.approvalStatus !== "REJECTED");
  if (kept.length === 0) return "Every item was rejected, so this order can't go ahead.";
  const waitingOnCustomer = order.items.find((item) => item.awaitingConsent);
  if (waitingOnCustomer) return `Waiting for the customer to accept or decline the generic for ${waitingOnCustomer.name ?? "an item"}.`;
  const undecided = order.items.find((item) => item.approvalStatus === "PENDING");
  if (undecided) return `${undecided.name ?? "An item"} still needs a pharmacist's decision.`;

  const prescriptionItems = kept.filter((item) => needsPrescription(item.schedule));
  if (prescriptionItems.length) {
    if (!order.verifiedByRegNo) return "Schedule H/H1 items need approval from a registered pharmacist.";
    if (prescriptionExpired(order, rules, now)) return `The prescription is older than ${rules.prescriptionValidityDays} days.`;
    const missingH1 = prescriptionItems.find((item) => item.schedule === "H1" && !item.hasH1Entry);
    if (missingH1) return `${missingH1.name ?? "A Schedule H1 item"} needs an H1 register entry first.`;
  }
  return null;
}

export function canAddToCart(schedule: ScheduleCode, rules: RuleSettings = defaultRules) {
  return schedule !== "X" || rules.xAllowedOnline;
}
