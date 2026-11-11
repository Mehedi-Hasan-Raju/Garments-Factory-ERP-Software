import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";
import { randomUUID } from "node:crypto";

import type {
  ReceiveStockInput,
  IssueStockInput,
  TransferStockInput,
  AdjustmentStockInput,
  CountStockInput,
  StockListQuery,
  HistoryQuery,
} from "./inventory.validation.js";

const decimal = (value: number) => new Prisma.Decimal(value);

async function createMovement(
  tx: Prisma.TransactionClient,
  data: {
    type: "RECEIVE" | "ISSUE" | "TRANSFER" | "ADJUSTMENT";
    productId: string;
    batchLotId: string;
    quantity: Prisma.Decimal;
    fromLocationId?: string | null;
    toLocationId?: string | null;
    referenceNo?: string;
    note?: string;
    createdById: string;
  }
) {
  return tx.stockMovement.create({
    data: {
      movementNo: `STK-${randomUUID()}`,
      ...data,
    },
  });
}

export const inventoryRepository = {
  async receive(data: ReceiveStockInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const batch = await tx.batchLot.upsert({
        where: {
          productId_batchNo: {
            productId: data.productId,
            batchNo: data.batchNo,
          },
        },
        create: {
          productId: data.productId,
          batchNo: data.batchNo,
          expiryDate: data.expiryDate,
        },
        update: data.expiryDate
          ? { expiryDate: data.expiryDate }
          : {},
      });

      const quantity = decimal(data.quantity);

      const stock = await tx.inventoryStock.upsert({
        where: {
          productId_locationId_batchLotId: {
            productId: data.productId,
            locationId: data.locationId,
            batchLotId: batch.id,
          },
        },
        create: {
          productId: data.productId,
          locationId: data.locationId,
          batchLotId: batch.id,
          quantity,
          minimumStock: decimal(data.minimumStock ?? 0),
        },
        update: {
          quantity: { increment: quantity },
          ...(data.minimumStock !== undefined
            ? { minimumStock: decimal(data.minimumStock) }
            : {}),
        },
        include: {
          product: true,
          location: true,
          batchLot: true,
        },
      });

      const movement = await createMovement(tx, {
        type: "RECEIVE",
        productId: data.productId,
        batchLotId: batch.id,
        toLocationId: data.locationId,
        quantity,
        referenceNo: data.referenceNo,
        note: data.note,
        createdById: userId,
      });

      return { stock, movement };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },

  async issue(data: IssueStockInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const quantity = decimal(data.quantity);

      const result = await tx.inventoryStock.updateMany({
        where: {
          productId: data.productId,
          locationId: data.locationId,
          batchLotId: data.batchLotId,
          quantity: { gte: quantity },
        },
        data: {
          quantity: { decrement: quantity },
        },
      });

      if (result.count !== 1) {
        throw new AppError("Insufficient stock or stock record not found", 400);
      }

      const stock = await tx.inventoryStock.findUnique({
        where: {
          productId_locationId_batchLotId: {
            productId: data.productId,
            locationId: data.locationId,
            batchLotId: data.batchLotId,
          },
        },
        include: {
          product: true,
          location: true,
          batchLot: true,
        },
      });

      const movement = await createMovement(tx, {
        type: "ISSUE",
        productId: data.productId,
        batchLotId: data.batchLotId,
        fromLocationId: data.locationId,
        quantity,
        referenceNo: data.referenceNo,
        note: data.note,
        createdById: userId,
      });

      return { stock, movement };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },

  async transfer(data: TransferStockInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const quantity = decimal(data.quantity);

      const result = await tx.inventoryStock.updateMany({
        where: {
          productId: data.productId,
          locationId: data.fromLocationId,
          batchLotId: data.batchLotId,
          quantity: { gte: quantity },
        },
        data: {
          quantity: { decrement: quantity },
        },
      });

      if (result.count !== 1) {
        throw new AppError("Insufficient source stock or stock record not found", 400);
      }

      const destinationStock = await tx.inventoryStock.upsert({
        where: {
          productId_locationId_batchLotId: {
            productId: data.productId,
            locationId: data.toLocationId,
            batchLotId: data.batchLotId,
          },
        },
        create: {
          productId: data.productId,
          locationId: data.toLocationId,
          batchLotId: data.batchLotId,
          quantity,
          minimumStock: decimal(0),
        },
        update: {
          quantity: { increment: quantity },
        },
        include: {
          product: true,
          location: true,
          batchLot: true,
        },
      });

      const movement = await createMovement(tx, {
        type: "TRANSFER",
        productId: data.productId,
        batchLotId: data.batchLotId,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        quantity,
        referenceNo: data.referenceNo,
        note: data.note,
        createdById: userId,
      });

      return { destinationStock, movement };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },

  async adjust(data: AdjustmentStockInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const quantity = decimal(data.quantity);

      if (data.direction === "INCREASE") {
        await tx.inventoryStock.upsert({
          where: {
            productId_locationId_batchLotId: {
              productId: data.productId,
              locationId: data.locationId,
              batchLotId: data.batchLotId,
            },
          },
          create: {
            productId: data.productId,
            locationId: data.locationId,
            batchLotId: data.batchLotId,
            quantity,
            minimumStock: decimal(0),
          },
          update: {
            quantity: { increment: quantity },
          },
        });
      } else {
        const result = await tx.inventoryStock.updateMany({
          where: {
            productId: data.productId,
            locationId: data.locationId,
            batchLotId: data.batchLotId,
            quantity: { gte: quantity },
          },
          data: {
            quantity: { decrement: quantity },
          },
        });

        if (result.count !== 1) {
          throw new AppError("Insufficient stock for adjustment", 400);
        }
      }

      const movement = await createMovement(tx, {
        type: "ADJUSTMENT",
        productId: data.productId,
        batchLotId: data.batchLotId,
        fromLocationId:
          data.direction === "DECREASE" ? data.locationId : null,
        toLocationId:
          data.direction === "INCREASE" ? data.locationId : null,
        quantity,
        referenceNo: data.referenceNo,
        note: `${data.direction}: ${data.note ?? "Stock adjustment"}`,
        createdById: userId,
      });

      const stock = await tx.inventoryStock.findUnique({
        where: {
          productId_locationId_batchLotId: {
            productId: data.productId,
            locationId: data.locationId,
            batchLotId: data.batchLotId,
          },
        },
        include: {
          product: true,
          location: true,
          batchLot: true,
        },
      });

      return { stock, movement };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },

  async count(data: CountStockInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const where = {
        productId_locationId_batchLotId: {
          productId: data.productId,
          locationId: data.locationId,
          batchLotId: data.batchLotId,
        },
      };

      const existing = await tx.inventoryStock.findUnique({
        where,
      });

      const oldQuantity = existing?.quantity ?? decimal(0);
      const actualQuantity = decimal(data.actualQuantity);
      const difference = actualQuantity.minus(oldQuantity);

      if (!existing && actualQuantity.greaterThan(0)) {
        await tx.inventoryStock.create({
          data: {
            productId: data.productId,
            locationId: data.locationId,
            batchLotId: data.batchLotId,
            quantity: actualQuantity,
            minimumStock: decimal(0),
          },
        });
      } else if (existing && !difference.equals(0)) {
        const updated = await tx.inventoryStock.updateMany({
          where: {
            id: existing.id,
            quantity: oldQuantity,
          },
          data: {
            quantity: actualQuantity,
          },
        });

        if (updated.count !== 1) {
          throw new AppError("Stock changed during counting. Please retry.", 409);
        }
      }

      const movement = await createMovement(tx, {
        type: "ADJUSTMENT",
        productId: data.productId,
        batchLotId: data.batchLotId,
        fromLocationId: difference.lessThan(0) ? data.locationId : null,
        toLocationId: difference.greaterThan(0) ? data.locationId : null,
        quantity: difference.abs(),
        referenceNo: data.referenceNo,
        note: `Physical stock count. System: ${oldQuantity.toString()}, Actual: ${actualQuantity.toString()}. ${data.note ?? ""}`,
        createdById: userId,
      });

      const stock = await tx.inventoryStock.findUnique({
        where,
        include: {
          product: true,
          location: true,
          batchLot: true,
        },
      });

      return { stock, movement };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },

  async findStock(query: StockListQuery) {
    const where: Prisma.InventoryStockWhereInput = {
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.batchLotId ? { batchLotId: query.batchLotId } : {}),
      ...(query.search
        ? {
            product: {
              OR: [
                { name: { contains: query.search, mode: "insensitive" } },
                { sku: { contains: query.search, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    };

    const skip = (query.page - 1) * query.limit;

    const [stocks, total] = await prisma.$transaction([
      prisma.inventoryStock.findMany({
        where,
        include: {
          product: { include: { category: true, unit: true } },
          location: true,
          batchLot: true,
        },
        orderBy: { updatedAt: query.sortOrder },
        skip,
        take: query.limit,
      }),
      prisma.inventoryStock.count({ where }),
    ]);

    return { stocks, total };
  },

  async findLowStock() {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "InventoryStock"
    WHERE quantity <= "minimumStock"
      AND "minimumStock" > 0
    ORDER BY quantity ASC
  `;

  if (rows.length === 0) return [];

  return prisma.inventoryStock.findMany({
    where: {
      id: { in: rows.map((row) => row.id) },
    },
    include: {
      product: { include: { category: true, unit: true } },
      location: true,
      batchLot: true,
    },
    orderBy: { quantity: "asc" },
  });
},

  async findHistory(query: HistoryQuery) {
    const where: Prisma.StockMovementWhereInput = {
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.batchLotId ? { batchLotId: query.batchLotId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.referenceNo
        ? { referenceNo: { contains: query.referenceNo, mode: "insensitive" } }
        : {}),
      ...(query.locationId
        ? {
            OR: [
              { fromLocationId: query.locationId },
              { toLocationId: query.locationId },
            ],
          }
        : {}),
      ...(query.fromDate || query.toDate
        ? {
            createdAt: {
              ...(query.fromDate ? { gte: query.fromDate } : {}),
              ...(query.toDate ? { lte: query.toDate } : {}),
            },
          }
        : {}),
    };

    const skip = (query.page - 1) * query.limit;

    const [movements, total] = await prisma.$transaction([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: true,
          batchLot: true,
          fromLocation: true,
          toLocation: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return { movements, total };
  },
};
