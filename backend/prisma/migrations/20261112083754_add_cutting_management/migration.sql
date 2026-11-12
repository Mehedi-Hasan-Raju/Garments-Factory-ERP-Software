-- CreateTable
CREATE TABLE "CuttingEntry" (
    "id" UUID NOT NULL,
    "cuttingNumber" VARCHAR(50) NOT NULL,
    "productionOrderId" UUID NOT NULL,
    "cuttingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cuttingQuantity" DECIMAL(18,3) NOT NULL,
    "fabricConsumed" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "fabricConsumedUnit" VARCHAR(20) NOT NULL DEFAULT 'KG',
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuttingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CuttingEntry_cuttingNumber_key" ON "CuttingEntry"("cuttingNumber");

-- CreateIndex
CREATE INDEX "CuttingEntry_productionOrderId_idx" ON "CuttingEntry"("productionOrderId");

-- CreateIndex
CREATE INDEX "CuttingEntry_cuttingDate_idx" ON "CuttingEntry"("cuttingDate");

-- CreateIndex
CREATE INDEX "CuttingEntry_createdById_idx" ON "CuttingEntry"("createdById");

-- AddForeignKey
ALTER TABLE "CuttingEntry" ADD CONSTRAINT "CuttingEntry_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
