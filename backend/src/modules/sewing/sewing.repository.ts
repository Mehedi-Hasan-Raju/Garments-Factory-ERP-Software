import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateSewingInput,
  UpdateSewingInput,
  SewingListQuery,
} from "./sewing.validation.js";

export const sewingRepository = {
  async findBySewingNumber(sewingNumber: string) {
    return prisma.sewingEntry.findUnique({
      where: { sewingNumber },
    });
  },

  async findById(id: string) {
    return prisma.sewingEntry.findUnique({
      where: { id },
      include: {
        productionOrder: true,
      },
    });
  },

  async findMany(
    where: Prisma.SewingEntryWhereInput,
    skip: number,
    take: number,
  ) {
    return prisma.sewingEntry.findMany({
      where,
      skip,
      take,
      orderBy: {
        sewingDate: "desc",
      },
      include: {
        productionOrder: {
          select: {
            id: true,
            orderNumber: true,
            styleNumber: true,
            status: true,
            orderQuantity: true,
            cuttingQuantity: true,
            sewingQuantity: true,
          },
        },
      },
    });
  },

  async count(where: Prisma.SewingEntryWhereInput) {
    return prisma.sewingEntry.count({ where });
  },

  async create(data: CreateSewingInput, createdById: string) {
    return prisma.$transaction(
      async (tx) => {
        const productionOrder = await tx.productionOrder.findUnique({
          where: { id: data.productionOrderId },
        });

        if (!productionOrder) {
          throw new Error("PRODUCTION_ORDER_NOT_FOUND");
        }

        if (
          productionOrder.status !== "CUTTING" &&
          productionOrder.status !== "SEWING"
        ) {
          throw new Error("INVALID_PRODUCTION_ORDER_STATUS");
        }

        const cuttingQuantity = new Prisma.Decimal(
          productionOrder.cuttingQuantity,
        );

        if (cuttingQuantity.lessThanOrEqualTo(0)) {
          throw new Error("CUTTING_NOT_STARTED");
        }

        const existing = await tx.sewingEntry.aggregate({
          where: { productionOrderId: data.productionOrderId },
          _sum: { sewingQuantity: true },
        });

        const existingQuantity = existing._sum.sewingQuantity ??
          new Prisma.Decimal(0);

        const newQuantity = new Prisma.Decimal(data.sewingQuantity);
        const totalQuantity = existingQuantity.plus(newQuantity);

        if (totalQuantity.greaterThan(cuttingQuantity)) {
          throw new Error("SEWING_EXCEEDS_CUTTING");
        }

        const sewingEntry = await tx.sewingEntry.create({
          data: {
            sewingNumber: data.sewingNumber,
            productionOrderId: data.productionOrderId,
            sewingDate: data.sewingDate,
            sewingLine: data.sewingLine,
            sewingQuantity: newQuantity,
            notes: data.notes,
            createdById,
          },
          include: {
            productionOrder: true,
          },
        });

        await tx.productionOrder.update({
          where: { id: data.productionOrderId },
          data: {
            sewingQuantity: totalQuantity,
            status: "SEWING",
          },
        });

        return tx.sewingEntry.findUniqueOrThrow({
          where: { id: sewingEntry.id },
          include: { productionOrder: true },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  },

  async update(
    id: string,
    data: UpdateSewingInput,
  ) {
    return prisma.$transaction(
      async (tx) => {
        const existingEntry = await tx.sewingEntry.findUnique({
          where: { id },
        });

        if (!existingEntry) {
          throw new Error("SEWING_ENTRY_NOT_FOUND");
        }

        const productionOrder = await tx.productionOrder.findUnique({
          where: { id: existingEntry.productionOrderId },
        });

        if (!productionOrder) {
          throw new Error("PRODUCTION_ORDER_NOT_FOUND");
        }

        if (
          productionOrder.status !== "CUTTING" &&
          productionOrder.status !== "SEWING"
        ) {
          throw new Error("INVALID_PRODUCTION_ORDER_STATUS");
        }

        const cuttingQuantity = new Prisma.Decimal(
          productionOrder.cuttingQuantity,
        );

        const otherEntries = await tx.sewingEntry.aggregate({
          where: {
            productionOrderId: existingEntry.productionOrderId,
            id: { not: id },
          },
          _sum: { sewingQuantity: true },
        });

        const otherQuantity = otherEntries._sum.sewingQuantity ??
          new Prisma.Decimal(0);

        const updatedEntryQuantity =
          data.sewingQuantity !== undefined
            ? new Prisma.Decimal(data.sewingQuantity)
            : new Prisma.Decimal(existingEntry.sewingQuantity);

        const totalQuantity = otherQuantity.plus(updatedEntryQuantity);

        if (totalQuantity.greaterThan(cuttingQuantity)) {
          throw new Error("SEWING_EXCEEDS_CUTTING");
        }

        await tx.sewingEntry.update({
          where: { id },
          data: {
            ...(data.sewingNumber !== undefined && {
              sewingNumber: data.sewingNumber,
            }),
            ...(data.sewingDate !== undefined && {
              sewingDate: data.sewingDate,
            }),
            ...(data.sewingLine !== undefined && {
              sewingLine: data.sewingLine,
            }),
            ...(data.sewingQuantity !== undefined && {
              sewingQuantity: updatedEntryQuantity,
            }),
            ...(data.notes !== undefined && {
              notes: data.notes,
            }),
          },
        });

        await tx.productionOrder.update({
          where: { id: existingEntry.productionOrderId },
          data: {
            sewingQuantity: totalQuantity,
          },
        });

        return tx.sewingEntry.findUniqueOrThrow({
          where: { id },
          include: { productionOrder: true },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  },

  async getProductionOrderSummary(productionOrderId: string) {
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      select: {
        id: true,
        orderNumber: true,
        styleNumber: true,
        status: true,
        orderQuantity: true,
        cuttingQuantity: true,
        sewingQuantity: true,
        sewingEntries: {
          orderBy: { sewingDate: "desc" },
        },
      },
    });

    return productionOrder;
  },
};