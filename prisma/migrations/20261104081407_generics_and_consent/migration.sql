-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "originalQty" INTEGER,
    "suggestedProductId" TEXT,
    "consentStatus" TEXT NOT NULL DEFAULT 'NONE',
    "decidedById" TEXT,
    "decidedAt" DATETIME,
    CONSTRAINT "OrderItem_suggestedProductId_fkey" FOREIGN KEY ("suggestedProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("approvalStatus", "decidedAt", "decidedById", "id", "orderId", "originalQty", "productId", "quantity", "rejectReason", "unitPrice") SELECT "approvalStatus", "decidedAt", "decidedById", "id", "orderId", "originalQty", "productId", "quantity", "rejectReason", "unitPrice" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL DEFAULT 'PRODUCT',
    "name" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "packSize" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "isBrand" BOOLEAN NOT NULL DEFAULT false,
    "genericOfId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_genericOfId_fkey" FOREIGN KEY ("genericOfId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("code", "createdAt", "form", "id", "name", "packSize", "price", "schedule", "strength", "updatedAt") SELECT "code", "createdAt", "form", "id", "name", "packSize", "price", "schedule", "strength", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");
CREATE UNIQUE INDEX "Product_name_strength_packSize_key" ON "Product"("name", "strength", "packSize");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
