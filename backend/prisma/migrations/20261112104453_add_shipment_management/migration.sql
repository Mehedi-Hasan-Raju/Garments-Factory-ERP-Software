-- CreateEnum
CREATE TYPE "ShipmentRecordStatus" AS ENUM ('PLANNED', 'READY', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Shipment" (
    "id" UUID NOT NULL,
    "shipmentNumber" VARCHAR(50) NOT NULL,
    "productionOrderId" UUID NOT NULL,
    "shipmentDate" TIMESTAMP(3),
    "expectedDeliveryDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "shippingMethod" VARCHAR(100),
    "carrierName" VARCHAR(150),
    "trackingNumber" VARCHAR(150),
    "destination" TEXT,
    "status" "ShipmentRecordStatus" NOT NULL DEFAULT 'PLANNED',
    "totalQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentItem" (
    "id" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "finishedGoodsEntryId" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentEvent" (
    "id" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "status" "ShipmentRecordStatus" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" VARCHAR(255),
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");

-- CreateIndex
CREATE INDEX "Shipment_productionOrderId_idx" ON "Shipment"("productionOrderId");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "Shipment_shipmentDate_idx" ON "Shipment"("shipmentDate");

-- CreateIndex
CREATE INDEX "Shipment_expectedDeliveryDate_idx" ON "Shipment"("expectedDeliveryDate");

-- CreateIndex
CREATE INDEX "Shipment_createdById_idx" ON "Shipment"("createdById");

-- CreateIndex
CREATE INDEX "ShipmentItem_shipmentId_idx" ON "ShipmentItem"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentItem_finishedGoodsEntryId_idx" ON "ShipmentItem"("finishedGoodsEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentItem_shipmentId_finishedGoodsEntryId_key" ON "ShipmentItem"("shipmentId", "finishedGoodsEntryId");

-- CreateIndex
CREATE INDEX "ShipmentEvent_shipmentId_idx" ON "ShipmentEvent"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentEvent_status_idx" ON "ShipmentEvent"("status");

-- CreateIndex
CREATE INDEX "ShipmentEvent_eventDate_idx" ON "ShipmentEvent"("eventDate");

-- CreateIndex
CREATE INDEX "ShipmentEvent_createdById_idx" ON "ShipmentEvent"("createdById");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_finishedGoodsEntryId_fkey" FOREIGN KEY ("finishedGoodsEntryId") REFERENCES "FinishedGoodsEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
