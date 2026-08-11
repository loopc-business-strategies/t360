CREATE TABLE "Branch" (
    "id" UUID NOT NULL,
    "tenantId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "hours" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "managerEmployeeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Warehouse" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Inventory" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "physicalQty" INTEGER NOT NULL DEFAULT 0,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryMovement" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "qtyDelta" INTEGER NOT NULL,
    "physicalAfter" INTEGER,
    "reservedAfter" INTEGER,
    "actorId" UUID,
    "reason" TEXT,
    "transferId" UUID,
    "reservationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockReservation" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "cartOrOrderRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockTransfer" (
    "id" UUID NOT NULL,
    "fromBranchId" UUID NOT NULL,
    "toBranchId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockTransferLine" (
    "id" UUID NOT NULL,
    "transferId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    CONSTRAINT "StockTransferLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");
CREATE INDEX "Branch_status_idx" ON "Branch"("status");
CREATE UNIQUE INDEX "Warehouse_branchId_code_key" ON "Warehouse"("branchId", "code");
CREATE INDEX "Warehouse_branchId_idx" ON "Warehouse"("branchId");
CREATE UNIQUE INDEX "Inventory_branchId_variantId_key" ON "Inventory"("branchId", "variantId");
CREATE INDEX "Inventory_variantId_idx" ON "Inventory"("variantId");
CREATE INDEX "Inventory_branchId_idx" ON "Inventory"("branchId");
CREATE INDEX "InventoryMovement_branchId_variantId_idx" ON "InventoryMovement"("branchId", "variantId");
CREATE INDEX "InventoryMovement_createdAt_idx" ON "InventoryMovement"("createdAt");
CREATE INDEX "InventoryMovement_type_idx" ON "InventoryMovement"("type");
CREATE INDEX "StockReservation_status_expiresAt_idx" ON "StockReservation"("status", "expiresAt");
CREATE INDEX "StockReservation_branchId_variantId_idx" ON "StockReservation"("branchId", "variantId");
CREATE INDEX "StockTransfer_status_idx" ON "StockTransfer"("status");
CREATE INDEX "StockTransferLine_transferId_idx" ON "StockTransferLine"("transferId");

ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_fromBranchId_fkey" FOREIGN KEY ("fromBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_toBranchId_fkey" FOREIGN KEY ("toBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransferLine" ADD CONSTRAINT "StockTransferLine_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockTransferLine" ADD CONSTRAINT "StockTransferLine_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
