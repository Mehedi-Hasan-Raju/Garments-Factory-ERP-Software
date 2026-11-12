-- CreateTable
CREATE TABLE "SewingEntry" (
    "id" UUID NOT NULL,
    "sewingNumber" VARCHAR(50) NOT NULL,
    "productionOrderId" UUID NOT NULL,
    "sewingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sewingLine" VARCHAR(100),
    "sewingQuantity" DECIMAL(18,3) NOT NULL,
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SewingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SewingEntry_sewingNumber_key" ON "SewingEntry"("sewingNumber");

-- CreateIndex
CREATE INDEX "SewingEntry_productionOrderId_idx" ON "SewingEntry"("productionOrderId");

-- CreateIndex
CREATE INDEX "SewingEntry_sewingDate_idx" ON "SewingEntry"("sewingDate");

-- CreateIndex
CREATE INDEX "SewingEntry_createdById_idx" ON "SewingEntry"("createdById");

-- AddForeignKey
ALTER TABLE "SewingEntry" ADD CONSTRAINT "SewingEntry_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
