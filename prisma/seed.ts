for (const file of [".env", ".env.local"]) { try { process.loadEnvFile(file); } catch { /* optional */ } }
import { encryptBuffer } from "../src/lib/prescriptions/crypto";
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

async function demoPrescription(id: string, patient: string, lines: string[], blurred = false) {
  const body = lines.map((line, index) => `<text x="60" y="${330 + index * 46}" font-size="28" font-family="cursive" fill="#1e3a8a">${line}</text>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="#fffdf5"/><rect x="0" y="0" width="800" height="120" fill="#e6f4f1"/><text x="60" y="70" font-size="34" font-family="Arial" font-weight="700" fill="#0f766e">Dr. S. Banerjee, MBBS, MD</text><text x="60" y="105" font-size="20" font-family="Arial" fill="#475569">Reg. No. WBMC 48213 · Salt Lake, Kolkata</text><text x="60" y="190" font-size="24" font-family="Arial" fill="#111">Patient: ${patient}</text><text x="560" y="190" font-size="20" font-family="Arial" fill="#475569">${id}</text><text x="60" y="270" font-size="56" font-family="serif" fill="#111">℞</text><g ${blurred ? 'filter="url(#b)"' : ""}>${body}</g><defs><filter id="b"><feGaussianBlur stdDeviation="5"/></filter></defs><text x="520" y="900" font-size="22" font-family="cursive" fill="#1e3a8a">Signature</text><text x="60" y="960" font-size="16" font-family="Arial" fill="#94a3b8">Sample prescription for demo only</text></svg>`;
  return encryptBuffer(Buffer.from(svg), "svg");
}

async function main() {
  await prisma.auditLog.deleteMany();
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
  const demoUsers = [
    { id: "user_debasish", phone: "9000000001", role: UserRole.CUSTOMER, name: "Debasish Ghosh" },
    { id: "user_pharmacist", phone: "9000000002", role: UserRole.PHARMACIST, name: "Ananya Roy" },
    { id: "user_rina", phone: "9000000003", role: UserRole.CUSTOMER, name: "Rina Sen" },
    { id: "user_arif", phone: "9000000004", role: UserRole.CUSTOMER, name: "Arif Mondal" },
  ] as const;
  for (const demo of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { phone: demo.phone } });
    if (existing && existing.id !== demo.id) await prisma.user.update({ where: { id: existing.id }, data: { id: demo.id } });
  }
  const customer = await prisma.user.upsert({ where: { id: "user_debasish" }, update: { phone: "9000000001", role: UserRole.CUSTOMER, name: "Debasish Ghosh", preferredLanguage: "en" }, create: { id: "user_debasish", phone: "9000000001", role: UserRole.CUSTOMER, name: "Debasish Ghosh", preferredLanguage: "en" } });
  const pharmacist = await prisma.user.upsert({ where: { id: "user_pharmacist" }, update: { phone: "9000000002", role: UserRole.PHARMACIST, name: "Ananya Roy", registrationNumber: "WB-PH-21487", preferredLanguage: "en" }, create: { id: "user_pharmacist", phone: "9000000002", role: UserRole.PHARMACIST, name: "Ananya Roy", registrationNumber: "WB-PH-21487", preferredLanguage: "en" } });
  const rina = await prisma.user.upsert({ where: { id: "user_rina" }, update: { phone: "9000000003", role: UserRole.CUSTOMER, name: "Rina Sen", preferredLanguage: "en" }, create: { id: "user_rina", phone: "9000000003", role: UserRole.CUSTOMER, name: "Rina Sen", preferredLanguage: "en" } });
  const arif = await prisma.user.upsert({ where: { id: "user_arif" }, update: { phone: "9000000004", role: UserRole.CUSTOMER, name: "Arif Mondal", preferredLanguage: "en" }, create: { id: "user_arif", phone: "9000000004", role: UserRole.CUSTOMER, name: "Arif Mondal", preferredLanguage: "en" } });
  const mother = await prisma.familyMember.create({ data: { name: "Mother", relation: "Mother", userId: customer.id } });

  const storeMap = new Map<string, string>();
  for (const [index, [code, name, area, pincode, lat, lng]] of stores.entries()) {
    const store = await prisma.store.create({ data: { code, name, area, pincode, lat, lng, phone: `+91 90000 ${String(index + 1).padStart(5, "0")}`, openHours: "08:00-22:00", deliveryRadiusKm: 8 } });
    storeMap.set(area, store.id);
  }
  const productMap = new Map<string, string>();
  for (const [name, strength, packSize, form, schedule, price] of products) {
    const code = name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
    const product = await prisma.product.create({ data: { code, name, strength, packSize, form, schedule, price } });
    productMap.set(name, product.id);
  }
  // Branded versions (made-up brand names) so pharmacists can offer the cheaper generic.
  const brands = [["Glucora", "Metformin", 78], ["Telmicare", "Telmisartan", 210], ["Thyrovance", "Levothyroxine", 265]] as const;
  for (const [brand, generic, price] of brands) {
    const base = await prisma.product.findFirst({ where: { name: generic } });
    if (!base) continue;
    const product = await prisma.product.create({ data: { code: brand.toUpperCase(), name: brand, strength: base.strength, packSize: base.packSize, form: base.form, schedule: base.schedule, price, isBrand: true, genericOfId: base.id } });
    productMap.set(brand, product.id);
  }
  const stockDate = new Date();
  stockDate.setUTCHours(0, 0, 0, 0);
  for (const storeId of storeMap.values()) {
    for (const [name] of products) {
      const gap = (storeId.charCodeAt(0) + name.length) % 17 === 0;
      await prisma.stock.create({ data: { storeId, productId: productMap.get(name)!, qty: gap ? 0 : 12 + (name.length % 20), date: stockDate } });
    }
    for (const [brand] of brands) if (productMap.get(brand)) await prisma.stock.create({ data: { storeId, productId: productMap.get(brand)!, qty: 10, date: stockDate } });
  }
  const pincodeRows = new Map<string, { code: string; area: string; lat: number; lng: number }>();
  for (let code = 700001; code <= 700160; code += 1) {
    const fraction = (code - 700001) / 159;
    pincodeRows.set(String(code), { code: String(code), area: code === 700064 ? "Salt Lake" : `Kolkata area ${String(code).slice(-3)}`, lat: 22.48 + fraction * .2, lng: 88.28 + fraction * .2 });
  }
  for (let code = 711101; code <= 711414; code += 1) {
    const fraction = (code - 711101) / 313;
    pincodeRows.set(String(code), { code: String(code), area: code === 711101 ? "Howrah Maidan" : `Howrah area ${String(code).slice(-3)}`, lat: 22.5 + fraction * .2, lng: 88.2 + fraction * .18 });
  }
  for (const [code, , , , lat, lng] of stores) {
    const current = pincodeRows.get(code === "SLK" ? "700064" : code === "BEH" ? "700034" : code === "HWM" ? "711101" : "");
    if (current) { current.lat = lat; current.lng = lng; }
  }
  pincodeRows.get("700034")!.area = "Behala";
  pincodeRows.get("700064")!.area = "Salt Lake";
  pincodeRows.get("711101")!.area = "Howrah Maidan";
  for (const row of pincodeRows.values()) await prisma.pincode.create({ data: row });
  await prisma.address.create({ data: { userId: customer.id, familyMemberId: mother.id, label: "Home", recipientName: "Madhabi Ghosh", phone: "9000000001", line1: "12 Lake View Road", line2: "Near Salt Lake Stadium", area: "Salt Lake", city: "Kolkata", pincode: "700064", lat: 22.5867, lng: 88.417, isDefault: true } });
  await prisma.address.create({ data: { userId: rina.id, label: "Home", recipientName: "Rina Sen", phone: "9000000003", line1: "8 Diamond Harbour Road", line2: "Near Behala Tram Depot", area: "Behala", city: "Kolkata", pincode: "700034", lat: 22.497, lng: 88.31, isDefault: true } });
  await prisma.address.create({ data: { userId: arif.id, label: "Home", recipientName: "Arif Mondal", phone: "9000000004", line1: "21 Station Road", line2: "Near Howrah Maidan", area: "Howrah Maidan", city: "Howrah", pincode: "711101", lat: 22.585, lng: 88.342, isDefault: true } });

  const metformin = productMap.get("Metformin")!;
  const telmisartan = productMap.get("Telmisartan")!;
  const levothyroxine = productMap.get("Levothyroxine")!;
  const saltLake = storeMap.get("Salt Lake")!;
  const behala = storeMap.get("Behala")!;
  const howrah = storeMap.get("Howrah Maidan")!;

  const order1 = await prisma.order.create({ data: { number: "RX-50211", customerId: customer.id, familyMemberId: mother.id, storeId: saltLake, status: OrderStatus.PACKED, total: 120, verifiedById: "user_pharmacist", verifiedAt: new Date(Date.now() - 50 * 60 * 1000), createdAt: new Date(Date.now() + 1000), items: { create: { productId: metformin, quantity: 4, unitPrice: 30, approvalStatus: ApprovalStatus.APPROVED, decidedById: "user_pharmacist", decidedAt: new Date(Date.now() - 50 * 60 * 1000) } } } });
  const order2 = await prisma.order.create({ data: { number: "RX-50214", customerId: rina.id, createdAt: new Date(Date.now() - 18 * 60 * 1000), storeId: behala, status: OrderStatus.AWAITING_PHARMACIST, total: 285, items: { create: { productId: telmisartan, quantity: 3, unitPrice: 95 } } } });
  const order3 = await prisma.order.create({ data: { number: "RX-50219", customerId: arif.id, decisionReason: "Prescription photo is blurred. Please upload a clearer photo.", storeId: howrah, status: OrderStatus.REUPLOAD_REQUESTED, total: 190, items: { create: { productId: levothyroxine, quantity: 1, unitPrice: 190 } } } });

  const prescription1 = await prisma.prescription.create({ data: { uploadedById: customer.id, orderId: order1.id, encryptedFilePath: await demoPrescription("RX-50211", "Madhabi Ghosh", ["Tab Metformin 500 mg", "1 tab twice daily after food", "x 60 days"]), doctorName: "Dr. S. Banerjee", doctorRegNo: "WBMC 48213", issuedOn: new Date(Date.now() - 20 * 86400000), aiDraft: [{ name: "Metformin", strength: "500 mg", quantity: 4, confidence: 0.94 }], status: PrescriptionStatus.APPROVED } });
  await prisma.approval.create({ data: { prescriptionId: prescription1.id, pharmacistId: pharmacist.id, notes: "Verified for demo order." } });
  await prisma.prescription.create({ data: { uploadedById: rina.id, orderId: order2.id, encryptedFilePath: await demoPrescription("RX-50214", "Rina Sen", ["Tab Telmisartan 40 mg", "1 tab once daily, morning", "x 30 days"]), issuedOn: new Date(Date.now() - 10 * 86400000), aiDraft: [{ name: "Telmisartan", strength: "40 mg", quantity: 3, confidence: 0.82 }], status: PrescriptionStatus.PENDING } });
  await prisma.prescription.create({ data: { uploadedById: arif.id, orderId: order3.id, encryptedFilePath: await demoPrescription("RX-50219", "Arif Mondal", ["Tab Levo??? 50", "once daily empty stomach"], true), aiDraft: Prisma.JsonNull, status: PrescriptionStatus.REUPLOAD_REQUESTED } });
  await prisma.refill.create({ data: { customerId: customer.id, familyMemberId: mother.id, productId: metformin, dosePerDay: 2, lastQty: 60, nextRunOutDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) } });

  await prisma.ruleConfig.createMany({ data: [
    { key: "schedule_h_requires_prescription", value: { requiresPrescription: true, pharmacistApproval: true }, description: "Schedule H medicines require a valid prescription and pharmacist approval." },
    { key: "schedule_h1_requires_register", value: { requiresPrescription: true, pharmacistApproval: true, h1Register: true }, description: "Schedule H1 medicines also create a register entry." },
    { key: "schedule_x_online_sale", value: { allowed: false }, description: "Schedule X and narcotic medicines cannot be sold online." },
    { key: "prescription_validity_days", value: { days: 180 }, description: "How long a prescription can be used for Schedule H/H1 items." },
  ] });

  console.log(`Seeded ${stores.length} stores, ${products.length} products, and 3 demo orders.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
