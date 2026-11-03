/*
  Warnings:

  - You are about to drop the column `line` on the `Address` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "familyMemberId" TEXT,
    "label" TEXT NOT NULL,
    "recipientName" TEXT,
    "phone" TEXT,
    "line1" TEXT,
    "line2" TEXT,
    "area" TEXT,
    "city" TEXT,
    "pincode" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Address_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Address_pincode_fkey" FOREIGN KEY ("pincode") REFERENCES "Pincode" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Address" ("createdAt", "id", "label", "lat", "lng", "pincode", "userId") SELECT "createdAt", "id", "label", "lat", "lng", "pincode", "userId" FROM "Address";
DROP TABLE "Address";
ALTER TABLE "new_Address" RENAME TO "Address";
CREATE INDEX "Address_userId_familyMemberId_idx" ON "Address"("userId", "familyMemberId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
