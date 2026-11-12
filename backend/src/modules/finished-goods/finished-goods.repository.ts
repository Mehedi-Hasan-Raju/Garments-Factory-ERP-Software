import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateFinishedGoodsInput,
  StockMovementInput,
} from "./finished-goods.validation.js";

export const finishedGoodsRepository = {
  findByNumber(finishedGoodsNumber: string) {
    return prisma.finishedGoodsEntry.findUnique({
      where: { finishedGoodsNumber },
    });
  },

  findById(id: string) {
    return prisma.finishedGoodsEntry.findUnique({
      where: { id },
      include: {
        productionOrder: true,
        qcInspection: {
          include: { defects: true },
        },
        warehouse: true,
        warehouseLocation: true,
        movements: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  async create(
    data: CreateFinishedGoodsInput,
    createdById: string,
  ) {
    return prisma.$transaction(
      async (tx) => {
        const qc = await tx.qCInspection.findUnique({
          where: { id: data.qcInspectionId },
          include: {
            productionOrder: true,
            finishedGoodsEntry: true,
          },
        });

        if (!qc) {
          throw new Error("QC_INSPECTION_NOT_FOUND");
        }

        if (new Prisma.Decimal(qc.passedQuantity).lessThanOrEqualTo(0)) {
          throw new Error("NO_PASSED_QUANTITY");
        }

        const existingEntry = await tx.finishedGoodsEntry.findUnique({
                where: { qcInspectionId: qc.id },
             });

        if (existingEntry) {
         throw new Error("QC_ALREADY_RECEIVED");
    }

        const warehouse = await tx.warehouse.findUnique({
          where: { id: data.warehouseId },
        });

        if (!warehouse) {
          throw new Error("WAREHOUSE_NOT_FOUND");
        }

        if (data.warehouseLocationId) {
          const location = await tx.warehouseLocation.findUnique({
            where: { id: data.warehouseLocationId },
          });

          if (!location) {
            throw new Error("WAREHOUSE_LOCATION_NOT_FOUND");
          }

          if (location.warehouseId !== data.warehouseId) {
            throw new Error("LOCATION_WAREHOUSE_MISMATCH");
          }
        }

        const quantity = new Prisma.Decimal(qc.passedQuantity);

        const entry = await tx.finishedGoodsEntry.create({
          data: {
            finishedGoodsNumber: data.finishedGoodsNumber,
            productionOrderId: qc.productionOrderId,
            qcInspectionId: qc.id,
            warehouseId: data.warehouseId,
            warehouseLocationId: data.warehouseLocationId,
            receivedDate: data.receivedDate,
            quantity,
            availableQuantity: quantity,
            reservedQuantity: new Prisma.Decimal(0),
            shippedQuantity: new Prisma.Decimal(0),
            notes: data.notes,
            createdById,
          },
        });

        await tx.finishedGoodsMovement.create({
          data: {
            finishedGoodsEntryId: entry.id,
            movementType: "RECEIPT",
            quantity,
            referenceNumber: qc.qcNumber,
            notes: "Finished goods received from QC passed quantity",
            createdById,
          },
        });

        const total = await tx.finishedGoodsEntry.aggregate({
          where: { productionOrderId: qc.productionOrderId },
          _sum: { quantity: true },
        });

        await tx.productionOrder.update({
          where: { id: qc.productionOrderId },
          data: {
            finishedGoodsQuantity:
              total._sum.quantity ?? new Prisma.Decimal(0),
          },
        });

        return tx.finishedGoodsEntry.findUniqueOrThrow({
          where: { id: entry.id },
          include: {
            productionOrder: true,
            qcInspection: true,
            warehouse: true,
            warehouseLocation: true,
            movements: true,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  },

  findMany(
    where: Prisma.FinishedGoodsEntryWhereInput,
    skip: number,
    take: number,
  ) {
    return prisma.finishedGoodsEntry.findMany({
      where,
      skip,
      take,
      orderBy: { receivedDate: "desc" },
      include: {
        productionOrder: {
          select: {
            id: true,
            orderNumber: true,
            styleNumber: true,
          },
        },
        qcInspection: {
          select: {
            id: true,
            qcNumber: true,
            passedQuantity: true,
          },
        },
        warehouse: true,
        warehouseLocation: true,
      },
    });
  },

  count(where: Prisma.FinishedGoodsEntryWhereInput) {
    return prisma.finishedGoodsEntry.count({ where });
  },

  async createMovement(
    id: string,
    data: StockMovementInput,
    createdById: string,
  ) {
    return prisma.$transaction(
      async (tx) => {
        const entry = await tx.finishedGoodsEntry.findUnique({
          where: { id },
        });

        if (!entry) {
          throw new Error("FINISHED_GOODS_NOT_FOUND");
        }

        const quantity = new Prisma.Decimal(data.quantity);
        const available = new Prisma.Decimal(entry.availableQuantity);
        const reserved = new Prisma.Decimal(entry.reservedQuantity);
        const shipped = new Prisma.Decimal(entry.shippedQuantity);

        let newAvailable = available;
        let newReserved = reserved;
        let newShipped = shipped;

        if (data.movementType === "RESERVATION") {
          if (available.lessThan(quantity)) {
            throw new Error("INSUFFICIENT_AVAILABLE_STOCK");
          }

          newAvailable = available.minus(quantity);
          newReserved = reserved.plus(quantity);
        }

        if (data.movementType === "RELEASE") {
          if (reserved.lessThan(quantity)) {
            throw new Error("INSUFFICIENT_RESERVED_STOCK");
          }

          newReserved = reserved.minus(quantity);
          newAvailable = available.plus(quantity);
        }

        if (data.movementType === "SHIPMENT") {
          if (available.lessThan(quantity)) {
            throw new Error("INSUFFICIENT_AVAILABLE_STOCK");
          }

          newAvailable = available.minus(quantity);
          newShipped = shipped.plus(quantity);
        }

        await tx.finishedGoodsEntry.update({
          where: { id },
          data: {
            availableQuantity: newAvailable,
            reservedQuantity: newReserved,
            shippedQuantity: newShipped,
          },
        });

        await tx.finishedGoodsMovement.create({
          data: {
            finishedGoodsEntryId: id,
            movementType: data.movementType,
            quantity,
            referenceNumber: data.referenceNumber,
            notes: data.notes,
            createdById,
          },
        });

        return tx.finishedGoodsEntry.findUniqueOrThrow({
          where: { id },
          include: {
            productionOrder: true,
            warehouse: true,
            warehouseLocation: true,
            movements: {
              orderBy: { createdAt: "desc" },
            },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  },

  async getProductionOrderSummary(productionOrderId: string) {
    return prisma.finishedGoodsEntry.aggregate({
      where: { productionOrderId },
      _sum: {
        quantity: true,
        availableQuantity: true,
        reservedQuantity: true,
        shippedQuantity: true,
      },
      _count: { id: true },
    });
  },
};