-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN "doctorName" TEXT;
ALTER TABLE "Prescription" ADD COLUMN "doctorRegNo" TEXT;
ALTER TABLE "Prescription" ADD COLUMN "issuedOn" DATETIME;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "registrationNumber" TEXT;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_H1RegisterEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prescriber" TEXT NOT NULL,
    "prescriberRegNo" TEXT NOT NULL DEFAULT '',
    "patient" TEXT NOT NULL,
    "patientAddress" TEXT NOT NULL DEFAULT '',
    "productId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "orderId" TEXT,
    "pharmacistId" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "H1RegisterEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "H1RegisterEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "H1RegisterEntry_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_H1RegisterEntry" ("date", "id", "patient", "prescriber", "productId", "qty") SELECT "date", "id", "patient", "prescriber", "productId", "qty" FROM "H1RegisterEntry";
DROP TABLE "H1RegisterEntry";
ALTER TABLE "new_H1RegisterEntry" RENAME TO "H1RegisterEntry";
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "familyMemberId" TEXT,
    "storeId" TEXT,
    "addressId" TEXT,
    "deliveryLat" REAL,
    "deliveryLng" REAL,
    "routingReason" TEXT,
    "missingItems" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total" DECIMAL NOT NULL,
    "verifiedById" TEXT,
    "verifiedAt" DATETIME,
    "decisionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("addressId", "createdAt", "customerId", "deliveryLat", "deliveryLng", "familyMemberId", "id", "missingItems", "number", "routingReason", "status", "storeId", "total", "updatedAt") SELECT "addressId", "createdAt", "customerId", "deliveryLat", "deliveryLng", "familyMemberId", "id", "missingItems", "number", "routingReason", "status", "storeId", "total", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "originalQty" INTEGER,
    "decidedById" TEXT,
    "decidedAt" DATETIME,
    CONSTRAINT "OrderItem_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("approvalStatus", "id", "orderId", "productId", "quantity", "rejectReason", "unitPrice") SELECT "approvalStatus", "id", "orderId", "productId", "quantity", "rejectReason", "unitPrice" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE TABLE "new_Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL DEFAULT 'STORE',
    "name" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "pincode" TEXT NOT NULL DEFAULT '700001',
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "openHours" TEXT NOT NULL DEFAULT '08:00-22:00',
    "phone" TEXT NOT NULL DEFAULT '+91 90000 00000',
    "deliveryRadiusKm" REAL NOT NULL DEFAULT 8,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Store" ("area", "code", "createdAt", "deliveryRadiusKm", "id", "lat", "lng", "name", "openHours", "pincode") SELECT "area", "code", "createdAt", "deliveryRadiusKm", "id", "lat", "lng", "name", "openHours", "pincode" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
CREATE UNIQUE INDEX "Store_code_key" ON "Store"("code");
CREATE UNIQUE INDEX "Store_area_key" ON "Store"("area");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AuditLog_orderId_createdAt_idx" ON "AuditLog"("orderId", "createdAt");
