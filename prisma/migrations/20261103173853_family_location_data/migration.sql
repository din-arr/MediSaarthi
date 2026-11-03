-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pincode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "area" TEXT NOT NULL DEFAULT 'Kolkata',
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL
);
INSERT INTO "new_Pincode" ("code", "id", "lat", "lng") SELECT "code", "id", "lat", "lng" FROM "Pincode";
DROP TABLE "Pincode";
ALTER TABLE "new_Pincode" RENAME TO "Pincode";
CREATE UNIQUE INDEX "Pincode_code_key" ON "Pincode"("code");
CREATE TABLE "new_Refill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "familyMemberId" TEXT,
    "productId" TEXT NOT NULL,
    "dosePerDay" DECIMAL NOT NULL,
    "lastQty" INTEGER NOT NULL,
    "nextRunOutDate" DATETIME NOT NULL,
    CONSTRAINT "Refill_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Refill_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Refill_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Refill" ("customerId", "dosePerDay", "id", "lastQty", "nextRunOutDate", "productId") SELECT "customerId", "dosePerDay", "id", "lastQty", "nextRunOutDate", "productId" FROM "Refill";
DROP TABLE "Refill";
ALTER TABLE "new_Refill" RENAME TO "Refill";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
