-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL DEFAULT 'PRODUCT',
    "name" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "packSize" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("createdAt", "form", "id", "name", "packSize", "price", "schedule", "strength", "updatedAt") SELECT "createdAt", "form", "id", "name", "packSize", "price", "schedule", "strength", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");
CREATE UNIQUE INDEX "Product_name_strength_packSize_key" ON "Product"("name", "strength", "packSize");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
