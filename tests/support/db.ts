import { prisma } from "../../src/lib/prisma";
import { createSession, type Role } from "../../src/lib/session";
import { stockDate } from "../../src/lib/routing";
import { setSessionToken } from "./next-headers";

export { prisma };

/** Wipes every table, children first. */
export async function resetDb() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.prescriptionAccessLog.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.h1RegisterEntry.deleteMany();
  await prisma.refill.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.otpRequest.deleteMany();
  await prisma.ruleConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany({ where: { genericOfId: { not: null } } });
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.pincode.deleteMany();
}

/** A small, realistic world: 2 Kolkata stores, a few medicines, one user per role. */
export async function seedWorld() {
  await resetDb();
  const saltLake = await prisma.store.create({ data: { code: "S1", name: "MediSaarthi Salt Lake", area: "Salt Lake", lat: 22.5867, lng: 88.417, deliveryRadiusKm: 8 } });
  const behala = await prisma.store.create({ data: { code: "S2", name: "MediSaarthi Behala", area: "Behala", lat: 22.4986, lng: 88.3106, deliveryRadiusKm: 8 } });
  await prisma.pincode.create({ data: { code: "700064", area: "Salt Lake", lat: 22.5867, lng: 88.417 } });
  await prisma.pincode.create({ data: { code: "700034", area: "Behala", lat: 22.4986, lng: 88.3106 } });

  const product = (code: string, name: string, schedule: "OTC" | "H" | "H1" | "X", price: number, extra: { genericOfId?: string; isBrand?: boolean; strength?: string } = {}) =>
    prisma.product.create({ data: { code, name, strength: extra.strength ?? "500 mg", packSize: "Strip of 10", form: "tablet", schedule, price, isBrand: extra.isBrand ?? false, genericOfId: extra.genericOfId } });
  const metformin = await product("P1", "Metformin", "H", 30);
  const metformin1000 = await product("P1B", "Metformin", "H", 55, { strength: "1000 mg" });
  const glucora = await product("P2", "Glucora", "H", 90, { genericOfId: metformin.id, isBrand: true });
  const paracetamol = await product("P3", "Paracetamol", "OTC", 20);
  const alprazolam = await product("P4", "Alprazolam", "H1", 60, { strength: "0.25 mg" });
  const morphine = await product("P5", "Morphine", "X", 200, { strength: "10 mg" });
  const telmisartan = await product("P6", "Telmisartan", "H", 95, { strength: "40 mg" });

  const today = stockDate();
  for (const store of [saltLake, behala]) {
    for (const item of [metformin, metformin1000, glucora, paracetamol, alprazolam, morphine, telmisartan]) {
      await prisma.stock.create({ data: { storeId: store.id, productId: item.id, qty: 50, date: today } });
    }
  }

  const customer = await prisma.user.create({ data: { phone: "9000000001", role: "CUSTOMER", name: "Debasish Ghosh" } });
  const other = await prisma.user.create({ data: { phone: "9000000003", role: "CUSTOMER", name: "Rina Sen" } });
  const pharmacist = await prisma.user.create({ data: { phone: "9000000002", role: "PHARMACIST", name: "Ananya Roy", registrationNumber: "WB-PH-21487" } });
  const staff = await prisma.user.create({ data: { phone: "9000000005", role: "STORE_STAFF", name: "Sourav Das", storeId: saltLake.id } });
  const ops = await prisma.user.create({ data: { phone: "9000000006", role: "OPS", name: "Priya Banerjee" } });
  const mother = await prisma.familyMember.create({ data: { userId: customer.id, name: "Madhabi", relation: "Mother" } });
  const address = await prisma.address.create({ data: { userId: customer.id, label: "Home", recipientName: "Debasish", phone: "9000000001", line1: "12 Lake View", line2: "Near stadium", area: "Salt Lake", city: "Kolkata", pincode: "700064", lat: 22.5867, lng: 88.417, isDefault: true } });

  return {
    stores: { saltLake, behala },
    products: { metformin, metformin1000, glucora, paracetamol, alprazolam, morphine, telmisartan },
    users: { customer, other, pharmacist, staff, ops },
    mother, address,
  };
}

export type World = Awaited<ReturnType<typeof seedWorld>>;

/** Signs a user in for the next route call (or signs out with no argument). */
export async function signIn(user?: { id: string; role: Role | string; name: string | null }) {
  setSessionToken(user ? await createSession({ userId: user.id, role: user.role as Role, name: user.name ?? "" }) : undefined);
}

type OrderOptions = {
  status?: "AWAITING_PHARMACIST" | "APPROVED" | "PACKED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "REUPLOAD_REQUESTED" | "REJECTED" | "PARTIAL";
  items?: Array<{ productId: string; quantity?: number; approvalStatus?: "PENDING" | "APPROVED" | "EDITED" | "REJECTED"; unitPrice?: number }>;
  prescription?: boolean | { issuedOn?: Date; uploadedAt?: Date; aiDraft?: unknown };
  storeId?: string | null;
  paymentMethod?: string;
  familyMemberId?: string;
  customerId?: string;
  verifiedById?: string;
  createdAt?: Date;
  verifiedAt?: Date;
  decisionReason?: string;
};

let counter = 0;
/** Creates an order straight in the database for a test. */
export async function makeOrder(world: World, options: OrderOptions = {}) {
  counter += 1;
  const items = options.items ?? [{ productId: world.products.metformin.id }];
  const order = await prisma.order.create({
    data: {
      number: `RX-T${Date.now()}${counter}`,
      customerId: options.customerId ?? world.users.customer.id,
      familyMemberId: options.familyMemberId,
      storeId: options.storeId === null ? null : options.storeId ?? world.stores.saltLake.id,
      addressId: world.address.id,
      status: options.status ?? "AWAITING_PHARMACIST",
      total: 60,
      paymentMethod: options.paymentMethod,
      verifiedById: options.verifiedById,
      verifiedAt: options.verifiedAt,
      decisionReason: options.decisionReason,
      createdAt: options.createdAt,
      items: { create: items.map((item) => ({ productId: item.productId, quantity: item.quantity ?? 2, unitPrice: item.unitPrice ?? 30, approvalStatus: item.approvalStatus ?? "PENDING" })) },
    },
    include: { items: true },
  });
  let prescription = null;
  if (options.prescription) {
    const extra = typeof options.prescription === "object" ? options.prescription : {};
    prescription = await prisma.prescription.create({ data: { uploadedById: order.customerId, orderId: order.id, encryptedFilePath: "db:png", fileData: null, issuedOn: extra.issuedOn, uploadedAt: extra.uploadedAt, aiDraft: extra.aiDraft as never } });
  }
  return { ...order, prescription };
}

export function jsonRequest(url: string, method: string, body?: unknown) {
  return new Request(`http://localhost${url}`, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
}

export const params = <T extends Record<string, string>>(value: T) => ({ params: Promise.resolve(value) });

/**
 * Temporarily replaces a method (e.g. a Prisma delegate call) to simulate a failure.
 * Returns a restore function, or null if the object won't accept the stub.
 */
export function stub<T extends object>(target: T, key: keyof T, replacement: unknown) {
  const original = target[key];
  try {
    (target as Record<PropertyKey, unknown>)[key] = replacement;
  } catch {
    return null;
  }
  if (target[key] !== replacement) return null;
  return () => { (target as Record<PropertyKey, unknown>)[key] = original; };
}
