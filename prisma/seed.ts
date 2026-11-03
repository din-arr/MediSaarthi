import { Prisma, PrismaClient, Schedule, OrderStatus, ApprovalStatus, PrescriptionStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  ["Metformin", "500 mg", "strip of 15", "tablet", Schedule.H, 30],
  ["Telmisartan", "40 mg", "strip of 10", "tablet", Schedule.H, 95],
  ["Levothyroxine", "50 mcg", "bottle of 100", "tablet", Schedule.H, 190],
  ["Amlodipine", "5 mg", "strip of 15", "tablet", Schedule.H, 42],
  ["Losartan", "50 mg", "strip of 10", "tablet", Schedule.H, 68],
  ["Atorvastatin", "10 mg", "strip of 10", "tablet", Schedule.H, 85],
  ["Pantoprazole", "40 mg", "strip of 15", "tablet", Schedule.H, 110],
  ["Glimepiride", "2 mg", "strip of 15", "tablet", Schedule.H, 72],
  ["Azithromycin", "500 mg", "strip of 3", "tablet", Schedule.H1, 120],
  ["Cefixime", "200 mg", "strip of 10", "tablet", Schedule.H1, 155],
  ["Montelukast", "10 mg", "strip of 10", "tablet", Schedule.H, 135],
  ["Salbutamol", "4 mg", "strip of 30", "tablet", Schedule.H, 55],
  ["Cetirizine", "10 mg", "strip of 10", "tablet", Schedule.OTC, 35],
  ["Paracetamol", "500 mg", "strip of 10", "tablet", Schedule.OTC, 22],
  ["ORS", "21 g", "box of 10", "sachet", Schedule.OTC, 110],
  ["Cough Syrup", "100 ml", "bottle of 1", "syrup", Schedule.OTC, 95],
  ["Antacid Suspension", "170 ml", "bottle of 1", "suspension", Schedule.OTC, 125],
  ["Vitamin D3", "60,000 IU", "strip of 4", "capsule", Schedule.OTC, 85],
  ["Calcium + Vitamin D", "500 mg", "strip of 15", "tablet", Schedule.OTC, 145],
  ["Multivitamin", "daily", "strip of 15", "tablet", Schedule.OTC, 120],
  ["Mupirocin", "2%", "tube of 5 g", "ointment", Schedule.H, 105],
  ["Clotrimazole", "1%", "tube of 15 g", "cream", Schedule.OTC, 90],
  ["Budesonide", "200 mcg", "inhaler of 120 doses", "inhaler", Schedule.H, 310],
  ["Insulin Glargine", "100 IU/ml", "pen of 3 ml", "injection", Schedule.H, 620],
  ["Amoxicillin", "500 mg", "strip of 10", "capsule", Schedule.H1, 98],
  ["Dextromethorphan", "10 mg", "strip of 10", "tablet", Schedule.OTC, 62],
  ["Loperamide", "2 mg", "strip of 10", "tablet", Schedule.OTC, 48],
  ["Diazepam", "5 mg", "strip of 10", "tablet", Schedule.X, 75],
  ["Ondansetron", "4 mg", "strip of 10", "tablet", Schedule.H, 80],
  ["Folic Acid", "5 mg", "strip of 30", "tablet", Schedule.OTC, 45],
] as const;

const stores = [
  ["MediSaarthi Salt Lake", "Salt Lake", 22.5867, 88.417],
  ["MediSaarthi Behala", "Behala", 22.497, 88.31],
  ["MediSaarthi Howrah Maidan", "Howrah Maidan", 22.585, 88.342],
  ["MediSaarthi Garia", "Garia", 22.467, 88.396],
  ["MediSaarthi Ballygunge", "Ballygunge", 22.525, 88.365],
  ["MediSaarthi Dum Dum", "Dum Dum", 22.652, 88.421],
] as const;

async function main() {
  await prisma.prescriptionAccessLog.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.h1RegisterEntry.deleteMany();
  await prisma.refill.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.ruleConfig.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  const customer = await prisma.user.create({ data: { phone: "9000000001", role: UserRole.CUSTOMER, name: "Demo customer" } });
  const pharmacist = await prisma.user.create({ data: { phone: "9000000002", role: UserRole.PHARMACIST, name: "Demo pharmacist" } });
  const mother = await prisma.familyMember.create({ data: { name: "Madhabi Ghosh", relation: "Mother", ownerId: customer.id } });

  const storeMap = new Map<string, string>();
  for (const [name, area, lat, lng] of stores) {
    const store = await prisma.store.create({ data: { name, area, lat, lng } });
    storeMap.set(area, store.id);
  }
  const productMap = new Map<string, string>();
  for (const [name, strength, packSize, form, schedule, price] of products) {
    const product = await prisma.product.create({ data: { name, strength, packSize, form, schedule, price } });
    productMap.set(name, product.id);
  }
  for (const storeId of storeMap.values()) {
    for (const [name] of products) {
      await prisma.stock.create({ data: { storeId, productId: productMap.get(name)!, qty: 12 + (name.length % 20), date: new Date() } });
    }
  }

  const metformin = productMap.get("Metformin")!;
  const telmisartan = productMap.get("Telmisartan")!;
  const levothyroxine = productMap.get("Levothyroxine")!;
  const saltLake = storeMap.get("Salt Lake")!;
  const behala = storeMap.get("Behala")!;
  const howrah = storeMap.get("Howrah Maidan")!;

  const order1 = await prisma.order.create({ data: { number: "RX-50211", customerId: customer.id, familyMemberId: mother.id, storeId: saltLake, status: OrderStatus.PACKED, total: 120, items: { create: { productId: metformin, quantity: 4, unitPrice: 30, approvalStatus: ApprovalStatus.APPROVED } } } });
  const order2 = await prisma.order.create({ data: { number: "RX-50214", customerId: customer.id, storeId: behala, status: OrderStatus.AWAITING_PHARMACIST, total: 285, items: { create: { productId: telmisartan, quantity: 3, unitPrice: 95 } } } });
  const order3 = await prisma.order.create({ data: { number: "RX-50219", customerId: customer.id, storeId: howrah, status: OrderStatus.REUPLOAD_REQUESTED, total: 190, items: { create: { productId: levothyroxine, quantity: 1, unitPrice: 190 } } } });

  const prescription1 = await prisma.prescription.create({ data: { uploadedById: customer.id, orderId: order1.id, encryptedFilePath: "encrypted/demo/rx-50211.enc", aiDraft: { patient: "Madhabi Ghosh", medicine: "Metformin 500 mg", quantity: 4 }, status: PrescriptionStatus.APPROVED } });
  await prisma.approval.create({ data: { prescriptionId: prescription1.id, pharmacistId: pharmacist.id, notes: "Verified for demo order." } });
  await prisma.prescription.create({ data: { uploadedById: customer.id, orderId: order2.id, encryptedFilePath: "encrypted/demo/rx-50214.enc", aiDraft: { medicine: "Telmisartan 40 mg", quantity: 3 }, status: PrescriptionStatus.PENDING } });
  await prisma.prescription.create({ data: { uploadedById: customer.id, orderId: order3.id, encryptedFilePath: "encrypted/demo/rx-50219.enc", aiDraft: Prisma.JsonNull, status: PrescriptionStatus.REUPLOAD_REQUESTED } });
  await prisma.refill.create({ data: { customerId: customer.id, productId: metformin, dosePerDay: 2, lastQty: 60, nextRunOutDate: new Date("2026-12-01") } });

  await prisma.ruleConfig.createMany({ data: [
    { key: "schedule_h_requires_prescription", value: { requiresPrescription: true, pharmacistApproval: true }, description: "Schedule H medicines require a valid prescription and pharmacist approval." },
    { key: "schedule_h1_requires_register", value: { requiresPrescription: true, pharmacistApproval: true, h1Register: true }, description: "Schedule H1 medicines also create a register entry." },
    { key: "schedule_x_online_sale", value: { allowed: false }, description: "Schedule X and narcotic medicines cannot be sold online." },
  ] });

  console.log(`Seeded ${stores.length} stores, ${products.length} products, and 3 demo orders.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
