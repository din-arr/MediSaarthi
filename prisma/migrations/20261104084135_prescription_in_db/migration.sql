-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN "fileData" BLOB;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Refill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "familyMemberId" TEXT,
    "productId" TEXT NOT NULL,
    "dosePerDay" DECIMAL NOT NULL,
    "lastQty" INTEGER NOT NULL,
    "nextRunOutDate" DATETIME NOT NULL,
    "autoRemind" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Refill_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Refill_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Refill_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Refill" ("customerId", "dosePerDay", "familyMemberId", "id", "lastQty", "nextRunOutDate", "productId") SELECT "customerId", "dosePerDay", "familyMemberId", "id", "lastQty", "nextRunOutDate", "productId" FROM "Refill";
DROP TABLE "Refill";
ALTER TABLE "new_Refill" RENAME TO "Refill";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "registrationNumber" TEXT,
    "storeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "id", "name", "phone", "preferredLanguage", "registrationNumber", "role", "updatedAt") SELECT "createdAt", "id", "name", "phone", "preferredLanguage", "registrationNumber", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
