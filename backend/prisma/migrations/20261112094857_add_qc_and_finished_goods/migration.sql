-- CreateEnum
CREATE TYPE "QCDefectSeverity" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FinishedGoodsMovementType" AS ENUM ('RECEIPT', 'RESERVATION', 'RELEASE', 'SHIPMENT', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateTable
CREATE TABLE "QCInspection" (
    "id" UUID NOT NULL,
    "qcNumber" VARCHAR(50) NOT NULL,
    "productionOrderId" UUID NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectedQuantity" DECIMAL(18,3) NOT NULL,
    "passedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "rejectedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "reworkQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QCInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QCDefect" (
    "id" UUID NOT NULL,
    "qcInspectionId" UUID NOT NULL,
    "defectType" VARCHAR(100) NOT NULL,
    "severity" "QCDefectSeverity" NOT NULL DEFAULT 'MINOR',
    "defectQuantity" DECIMAL(18,3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QCDefect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinishedGoodsEntry" (
    "id" UUID NOT NULL,
    "finishedGoodsNumber" VARCHAR(50) NOT NULL,
    "productionOrderId" UUID NOT NULL,
    "qcInspectionId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "warehouseLocationId" UUID,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" DECIMAL(18,3) NOT NULL,
    "availableQuantity" DECIMAL(18,3) NOT NULL,
    "reservedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "shippedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinishedGoodsEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinishedGoodsMovement" (
    "id" UUID NOT NULL,
    "finishedGoodsEntryId" UUID NOT NULL,
    "movementType" "FinishedGoodsMovementType" NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "referenceNumber" VARCHAR(100),
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinishedGoodsMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QCInspection_qcNumber_key" ON "QCInspection"("qcNumber");

-- CreateIndex
CREATE INDEX "QCInspection_productionOrderId_idx" ON "QCInspection"("productionOrderId");

-- CreateIndex
CREATE INDEX "QCInspection_inspectionDate_idx" ON "QCInspection"("inspectionDate");

-- CreateIndex
CREATE INDEX "QCInspection_createdById_idx" ON "QCInspection"("createdById");

-- CreateIndex
CREATE INDEX "QCDefect_qcInspectionId_idx" ON "QCDefect"("qcInspectionId");

-- CreateIndex
CREATE INDEX "QCDefect_defectType_idx" ON "QCDefect"("defectType");

-- CreateIndex
CREATE INDEX "QCDefect_severity_idx" ON "QCDefect"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "FinishedGoodsEntry_finishedGoodsNumber_key" ON "FinishedGoodsEntry"("finishedGoodsNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FinishedGoodsEntry_qcInspectionId_key" ON "FinishedGoodsEntry"("qcInspectionId");

-- CreateIndex
CREATE INDEX "FinishedGoodsEntry_productionOrderId_idx" ON "FinishedGoodsEntry"("productionOrderId");

-- CreateIndex
CREATE INDEX "FinishedGoodsEntry_warehouseId_idx" ON "FinishedGoodsEntry"("warehouseId");

-- CreateIndex
CREATE INDEX "FinishedGoodsEntry_warehouseLocationId_idx" ON "FinishedGoodsEntry"("warehouseLocationId");

-- CreateIndex
CREATE INDEX "FinishedGoodsEntry_receivedDate_idx" ON "FinishedGoodsEntry"("receivedDate");

-- CreateIndex
CREATE INDEX "FinishedGoodsEntry_createdById_idx" ON "FinishedGoodsEntry"("createdById");

-- CreateIndex
CREATE INDEX "FinishedGoodsMovement_finishedGoodsEntryId_idx" ON "FinishedGoodsMovement"("finishedGoodsEntryId");

-- CreateIndex
CREATE INDEX "FinishedGoodsMovement_movementType_idx" ON "FinishedGoodsMovement"("movementType");

-- CreateIndex
CREATE INDEX "FinishedGoodsMovement_createdAt_idx" ON "FinishedGoodsMovement"("createdAt");

-- CreateIndex
CREATE INDEX "FinishedGoodsMovement_createdById_idx" ON "FinishedGoodsMovement"("createdById");

-- AddForeignKey
ALTER TABLE "QCInspection" ADD CONSTRAINT "QCInspection_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCInspection" ADD CONSTRAINT "QCInspection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCDefect" ADD CONSTRAINT "QCDefect_qcInspectionId_fkey" FOREIGN KEY ("qcInspectionId") REFERENCES "QCInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishedGoodsEntry" ADD CONSTRAINT "FinishedGoodsEntry_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishedGoodsEntry" ADD CONSTRAINT "FinishedGoodsEntry_qcInspectionId_fkey" FOREIGN KEY ("qcInspectionId") REFERENCES "QCInspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishedGoodsEntry" ADD CONSTRAINT "FinishedGoodsEntry_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishedGoodsEntry" ADD CONSTRAINT "FinishedGoodsEntry_warehouseLocationId_fkey" FOREIGN KEY ("warehouseLocationId") REFERENCES "WarehouseLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishedGoodsEntry" ADD CONSTRAINT "FinishedGoodsEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishedGoodsMovement" ADD CONSTRAINT "FinishedGoodsMovement_finishedGoodsEntryId_fkey" FOREIGN KEY ("finishedGoodsEntryId") REFERENCES "FinishedGoodsEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishedGoodsMovement" ADD CONSTRAINT "FinishedGoodsMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
