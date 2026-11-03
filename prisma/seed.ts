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
  ["SLK", "MediSaarthi Salt Lake", "Salt Lake", "700064", 22.5867, 88.417],
  ["BEH", "MediSaarthi Behala", "Behala", "700034", 22.497, 88.31],
  ["HWM", "MediSaarthi Howrah Maidan", "Howrah Maidan", "711101", 22.585, 88.342],
  ["GAR", "MediSaarthi Garia", "Garia", "700084", 22.467, 88.396],
  ["BAL", "MediSaarthi Ballygunge", "Ballygunge", "700019", 22.525, 88.365],
  ["DUM", "MediSaarthi Dum Dum", "Dum Dum", "700080", 22.652, 88.421],
  ["PKS", "MediSaarthi Park Street", "Park Street", "700016", 22.553, 88.351],
  ["NEW", "MediSaarthi New Town", "New Town", "700156", 22.579, 88.475],
  ["DUM2", "MediSaarthi Lake Town", "Lake Town", "700089", 22.607, 88.401],
  ["SHY", "MediSaarthi Shyambazar", "Shyambazar", "700004", 22.601, 88.373],
  ["TOL", "MediSaarthi Tollygunge", "Tollygunge", "700033", 22.499, 88.347],
  ["JAD", "MediSaarthi Jadavpur", "Jadavpur", "700032", 22.499, 88.369],
  ["BAR", "MediSaarthi Barasat", "Barasat", "700124", 22.722, 88.482],
  ["BAL2", "MediSaarthi Bally", "Bally", "711201", 22.655, 88.34],
  ["SHI", "MediSaarthi Shibpur", "Shibpur", "711102", 22.577, 88.323],
  ["SAN", "MediSaarthi Santragachi", "Santragachi", "711112", 22.583, 88.288],
  ["KAS", "MediSaarthi Kasba", "Kasba", "700042", 22.514, 88.386],
  ["ESP", "MediSaarthi Esplanade", "Esplanade", "700069", 22.566, 88.351],
  ["RAJ", "MediSaarthi Rajarhat", "Rajarhat", "700135", 22.626, 88.462],
  ["ALP", "MediSaarthi Alipore", "Alipore", "700027", 22.531, 88.331],
  ["BHA", "MediSaarthi Bhawanipur", "Bhawanipur", "700025", 22.531, 88.342],
  ["CAM", "MediSaarthi Camac Street", "Camac Street", "700017", 22.548, 88.355],
  ["GOL", "MediSaarthi Golpark", "Golpark", "700029", 22.514, 88.366],
  ["DHA", "MediSaarthi Dhakuria", "Dhakuria", "700031", 22.507, 88.364],
  ["KAL", "MediSaarthi Kalighat", "Kalighat", "700026", 22.52, 88.346],
  ["RUB", "MediSaarthi Ruby", "Ruby", "700107", 22.512, 88.401],
  ["TAN", "MediSaarthi Tangra", "Tangra", "700015", 22.546, 88.378],
  ["BEA", "MediSaarthi Belgachia", "Belgachia", "700037", 22.62, 88.385],
  ["MAN", "MediSaarthi Maniktala", "Maniktala", "700006", 22.59, 88.383],
  ["ULT", "MediSaarthi Ultadanga", "Ultadanga", "700004", 22.595, 88.395],
  ["SOD", "MediSaarthi Sodepur", "Sodepur", "700110", 22.704, 88.384],
  ["KHA", "MediSaarthi Khardaha", "Khardaha", "700116", 22.718, 88.377],
  ["DAN", "MediSaarthi Dankuni", "Dankuni", "712311", 22.67, 88.3],
  ["LIL", "MediSaarthi Liluah", "Liluah", "711204", 22.63, 88.342],
  ["DOM", "MediSaarthi Domjur", "Domjur", "711405", 22.64, 88.22],
  ["AND", "MediSaarthi Andul", "Andul", "711302", 22.58, 88.235],
  ["MAH", "MediSaarthi Maheshtala", "Maheshtala", "700141", 22.51, 88.25],
  ["JOK", "MediSaarthi Joka", "Joka", "700104", 22.45, 88.3],
  ["NAR", "MediSaarthi Narendrapur", "Narendrapur", "700103", 22.44, 88.39],
  ["SON", "MediSaarthi Sonarpur", "Sonarpur", "700150", 22.445, 88.405],
  ["BAG", "MediSaarthi Baguiati", "Baguiati", "700059", 22.625, 88.43],
  ["KAI", "MediSaarthi Kestopur", "Kestopur", "700102", 22.596, 88.435],
  ["CHN", "MediSaarthi Chinar Park", "Chinar Park", "700052", 22.623, 88.45],
  ["MUK", "MediSaarthi Mukundapur", "Mukundapur", "700099", 22.48, 88.405],
  ["THA", "MediSaarthi Thakurpukur", "Thakurpukur", "700063", 22.46, 88.31],
  ["KOL", "MediSaarthi Kolkata Airport", "Airport", "700052", 22.65, 88.446],
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
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.pincode.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.ruleConfig.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  const customer = await prisma.user.create({ data: { phone: "9000000001", role: UserRole.CUSTOMER, name: "Debasish Ghosh", preferredLanguage: "en" } });
  const pharmacist = await prisma.user.create({ data: { phone: "9000000002", role: UserRole.PHARMACIST, name: "Demo pharmacist", preferredLanguage: "en" } });
  await prisma.user.create({ data: { phone: "9000000003", role: UserRole.CUSTOMER, name: "Rina Sen", preferredLanguage: "en" } });
  const mother = await prisma.familyMember.create({ data: { name: "Mother", relation: "Mother", userId: customer.id } });

  const storeMap = new Map<string, string>();
  for (const [code, name, area, pincode, lat, lng] of stores) {
    const store = await prisma.store.create({ data: { code, name, area, pincode, lat, lng, openHours: "08:00-22:00", deliveryRadiusKm: 8 } });
    storeMap.set(area, store.id);
  }
  const productMap = new Map<string, string>();
  for (const [name, strength, packSize, form, schedule, price] of products) {
    const code = name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
    const product = await prisma.product.create({ data: { code, name, strength, packSize, form, schedule, price } });
    productMap.set(name, product.id);
  }
  const stockDate = new Date();
  stockDate.setUTCHours(0, 0, 0, 0);
  for (const storeId of storeMap.values()) {
    for (const [name] of products) {
      const gap = (storeId.charCodeAt(0) + name.length) % 17 === 0;
      await prisma.stock.create({ data: { storeId, productId: productMap.get(name)!, qty: gap ? 0 : 12 + (name.length % 20), date: stockDate } });
    }
  }
  const pincodeRows = new Map<string, { code: string; lat: number; lng: number }>(stores.map(([, , , code, lat, lng]) => [code, { code, lat, lng }]));
  for (const [code, lat, lng] of [["700001", 22.57, 88.35], ["700002", 22.61, 88.37], ["700005", 22.6, 88.38], ["700007", 22.58, 88.36], ["700009", 22.57, 88.37], ["700012", 22.57, 88.36], ["700014", 22.55, 88.37], ["700020", 22.54, 88.36], ["700023", 22.53, 88.34], ["700028", 22.63, 88.41], ["700035", 22.61, 88.39], ["700039", 22.54, 88.4], ["700040", 22.51, 88.32], ["700041", 22.49, 88.31], ["700045", 22.5, 88.38], ["700047", 22.48, 88.38], ["700053", 22.47, 88.33], ["700060", 22.5, 88.3], ["700061", 22.48, 88.29], ["700075", 22.5, 88.4], ["700078", 22.5, 88.39], ["700082", 22.53, 88.32], ["700091", 22.59, 88.42], ["700098", 22.57, 88.44], ["700105", 22.55, 88.4], ["700108", 22.7, 88.39], ["700118", 22.73, 88.39], ["700123", 22.69, 88.45], ["700126", 22.72, 88.46], ["700129", 22.74, 88.43], ["711103", 22.57, 88.32], ["711104", 22.59, 88.33], ["711106", 22.61, 88.33], ["711107", 22.61, 88.34], ["711109", 22.6, 88.31], ["711110", 22.59, 88.3], ["711113", 22.57, 88.3], ["711114", 22.56, 88.3], ["711202", 22.64, 88.34], ["711203", 22.64, 88.35], ["711205", 22.63, 88.36], ["711206", 22.66, 88.35], ["711302", 22.58, 88.24], ["711308", 22.6, 88.25], ["711313", 22.62, 88.27], ["711316", 22.64, 88.28], ["711401", 22.65, 88.23], ["711403", 22.63, 88.22], ["711404", 22.64, 88.21], ["711409", 22.62, 88.2]] as const) pincodeRows.set(code, { code, lat, lng });
  for (const row of pincodeRows.values()) await prisma.pincode.create({ data: row });
  await prisma.address.create({ data: { userId: customer.id, label: "Home", line: "12 Lake View Road", pincode: "700064", lat: 22.5867, lng: 88.417 } });

  const metformin = productMap.get("Metformin")!;
  const telmisartan = productMap.get("Telmisartan")!;
  const levothyroxine = productMap.get("Levothyroxine")!;
  const saltLake = storeMap.get("Salt Lake")!;
  const behala = storeMap.get("Behala")!;
  const howrah = storeMap.get("Howrah Maidan")!;

  const order1 = await prisma.order.create({ data: { number: "RX-50211", customerId: customer.id, familyMemberId: mother.id, storeId: saltLake, status: OrderStatus.PACKED, total: 120, createdAt: new Date(Date.now() + 1000), items: { create: { productId: metformin, quantity: 4, unitPrice: 30, approvalStatus: ApprovalStatus.APPROVED } } } });
  const order2 = await prisma.order.create({ data: { number: "RX-50214", customerId: customer.id, storeId: behala, status: OrderStatus.AWAITING_PHARMACIST, total: 285, items: { create: { productId: telmisartan, quantity: 3, unitPrice: 95 } } } });
  const order3 = await prisma.order.create({ data: { number: "RX-50219", customerId: customer.id, storeId: howrah, status: OrderStatus.REUPLOAD_REQUESTED, total: 190, items: { create: { productId: levothyroxine, quantity: 1, unitPrice: 190 } } } });

  const prescription1 = await prisma.prescription.create({ data: { uploadedById: customer.id, orderId: order1.id, encryptedFilePath: "encrypted/demo/rx-50211.enc", aiDraft: { patient: "Madhabi Ghosh", medicine: "Metformin 500 mg", quantity: 4 }, status: PrescriptionStatus.APPROVED } });
  await prisma.approval.create({ data: { prescriptionId: prescription1.id, pharmacistId: pharmacist.id, notes: "Verified for demo order." } });
  await prisma.prescription.create({ data: { uploadedById: customer.id, orderId: order2.id, encryptedFilePath: "encrypted/demo/rx-50214.enc", aiDraft: { medicine: "Telmisartan 40 mg", quantity: 3 }, status: PrescriptionStatus.PENDING } });
  await prisma.prescription.create({ data: { uploadedById: customer.id, orderId: order3.id, encryptedFilePath: "encrypted/demo/rx-50219.enc", aiDraft: Prisma.JsonNull, status: PrescriptionStatus.REUPLOAD_REQUESTED } });
  await prisma.refill.create({ data: { customerId: customer.id, productId: metformin, dosePerDay: 2, lastQty: 60, nextRunOutDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) } });

  await prisma.ruleConfig.createMany({ data: [
    { key: "schedule_h_requires_prescription", value: { requiresPrescription: true, pharmacistApproval: true }, description: "Schedule H medicines require a valid prescription and pharmacist approval." },
    { key: "schedule_h1_requires_register", value: { requiresPrescription: true, pharmacistApproval: true, h1Register: true }, description: "Schedule H1 medicines also create a register entry." },
    { key: "schedule_x_online_sale", value: { allowed: false }, description: "Schedule X and narcotic medicines cannot be sold online." },
  ] });

  console.log(`Seeded ${stores.length} stores, ${products.length} products, and 3 demo orders.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
