/*
  Warnings:

  - Made the column `area` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `line1` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `line2` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `recipientName` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Address` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "familyMemberId" TEXT,
    "label" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Address_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Address_pincode_fkey" FOREIGN KEY ("pincode") REFERENCES "Pincode" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Address" ("area", "city", "createdAt", "familyMemberId", "id", "isDefault", "label", "lat", "line1", "line2", "lng", "phone", "pincode", "recipientName", "updatedAt", "userId") SELECT "area", "city", "createdAt", "familyMemberId", "id", "isDefault", "label", "lat", "line1", "line2", "lng", "phone", "pincode", "recipientName", "updatedAt", "userId" FROM "Address";
DROP TABLE "Address";
ALTER TABLE "new_Address" RENAME TO "Address";
CREATE INDEX "Address_userId_familyMemberId_idx" ON "Address"("userId", "familyMemberId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
