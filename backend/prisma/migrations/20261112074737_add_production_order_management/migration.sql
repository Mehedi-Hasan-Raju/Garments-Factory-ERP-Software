-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('PENDING', 'CUTTING', 'SEWING', 'QC', 'COMPLETED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('NOT_SHIPPED', 'READY', 'PARTIALLY_SHIPPED', 'SHIPPED', 'DELIVERED');

-- CreateTable
CREATE TABLE "ProductionOrder" (
    "id" UUID NOT NULL,
    "orderNumber" VARCHAR(50) NOT NULL,
    "buyingHouseId" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "styleNumber" VARCHAR(100) NOT NULL,
    "designImageUrl" VARCHAR(1000),
    "orderQuantity" DECIMAL(18,3) NOT NULL,
    "fabricRequirement" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "fabricRequirementUnit" VARCHAR(20) NOT NULL DEFAULT 'KG',
    "cuttingQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "sewingQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "rejectedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "finishedGoodsQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "targetPrice" DECIMAL(18,2) NOT NULL,
    "orderValue" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
    "paymentTerms" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "status" "ProductionOrderStatus" NOT NULL DEFAULT 'PENDING',
    "shipmentStatus" "ShipmentStatus" NOT NULL DEFAULT 'NOT_SHIPPED',
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_orderNumber_key" ON "ProductionOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "ProductionOrder_buyingHouseId_status_idx" ON "ProductionOrder"("buyingHouseId", "status");

-- CreateIndex
CREATE INDEX "ProductionOrder_buyerId_idx" ON "ProductionOrder"("buyerId");

-- CreateIndex
CREATE INDEX "ProductionOrder_productId_idx" ON "ProductionOrder"("productId");

-- CreateIndex
CREATE INDEX "ProductionOrder_status_deliveryDate_idx" ON "ProductionOrder"("status", "deliveryDate");

-- CreateIndex
CREATE INDEX "ProductionOrder_orderDate_idx" ON "ProductionOrder"("orderDate");

-- CreateIndex
CREATE INDEX "ProductionOrder_deliveryDate_idx" ON "ProductionOrder"("deliveryDate");

-- CreateIndex
CREATE INDEX "ProductionOrder_createdById_idx" ON "ProductionOrder"("createdById");

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_buyingHouseId_fkey" FOREIGN KEY ("buyingHouseId") REFERENCES "BuyingHouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
