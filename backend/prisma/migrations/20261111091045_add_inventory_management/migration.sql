-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('RECEIVE', 'ISSUE', 'TRANSFER', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "BatchLot" (
    "id" UUID NOT NULL,
    "batchNo" VARCHAR(100) NOT NULL,
    "productId" UUID NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryStock" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "batchLotId" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "minimumStock" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" UUID NOT NULL,
    "movementNo" VARCHAR(50) NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "productId" UUID NOT NULL,
    "batchLotId" UUID NOT NULL,
    "fromLocationId" UUID,
    "toLocationId" UUID,
    "quantity" DECIMAL(18,3) NOT NULL,
    "referenceNo" VARCHAR(100),
    "note" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BatchLot_productId_idx" ON "BatchLot"("productId");

-- CreateIndex
CREATE INDEX "BatchLot_expiryDate_idx" ON "BatchLot"("expiryDate");

-- CreateIndex
CREATE INDEX "BatchLot_isActive_idx" ON "BatchLot"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BatchLot_productId_batchNo_key" ON "BatchLot"("productId", "batchNo");

-- CreateIndex
CREATE INDEX "InventoryStock_productId_idx" ON "InventoryStock"("productId");

-- CreateIndex
CREATE INDEX "InventoryStock_locationId_idx" ON "InventoryStock"("locationId");

-- CreateIndex
CREATE INDEX "InventoryStock_batchLotId_idx" ON "InventoryStock"("batchLotId");

-- CreateIndex
CREATE INDEX "InventoryStock_quantity_idx" ON "InventoryStock"("quantity");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryStock_productId_locationId_batchLotId_key" ON "InventoryStock"("productId", "locationId", "batchLotId");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_movementNo_key" ON "StockMovement"("movementNo");

-- CreateIndex
CREATE INDEX "StockMovement_type_createdAt_idx" ON "StockMovement"("type", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_batchLotId_idx" ON "StockMovement"("batchLotId");

-- CreateIndex
CREATE INDEX "StockMovement_fromLocationId_idx" ON "StockMovement"("fromLocationId");

-- CreateIndex
CREATE INDEX "StockMovement_toLocationId_idx" ON "StockMovement"("toLocationId");

-- CreateIndex
CREATE INDEX "StockMovement_createdById_idx" ON "StockMovement"("createdById");

-- CreateIndex
CREATE INDEX "StockMovement_referenceNo_idx" ON "StockMovement"("referenceNo");

-- AddForeignKey
ALTER TABLE "BatchLot" ADD CONSTRAINT "BatchLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryStock" ADD CONSTRAINT "InventoryStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryStock" ADD CONSTRAINT "InventoryStock_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryStock" ADD CONSTRAINT "InventoryStock_batchLotId_fkey" FOREIGN KEY ("batchLotId") REFERENCES "BatchLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_batchLotId_fkey" FOREIGN KEY ("batchLotId") REFERENCES "BatchLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "WarehouseLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "WarehouseLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
