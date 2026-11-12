
import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/app-error.js";

const editableStatuses = ["PENDING", "CUTTING"];

export const cuttingRepository = {
  async create(data: Prisma.CuttingEntryUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.productionOrder.findUnique({
        where: { id: data.productionOrderId },
      });

      if (!order) {
        throw new AppError("Production order not found", 404);
      }

      if (!editableStatuses.includes(order.status)) {
        throw new AppError(
          "Cutting entries are not allowed at this production stage",
          400,
        );
      }

      const aggregate = await tx.cuttingEntry.aggregate({
        where: { productionOrderId: order.id },
        _sum: { cuttingQuantity: true },
      });

      const currentTotal = aggregate._sum.cuttingQuantity ??
        new Prisma.Decimal(0);

      const newTotal = currentTotal.add(
        new Prisma.Decimal(data.cuttingQuantity as Prisma.Decimal),
      );

      if (newTotal.gt(order.orderQuantity)) {
        throw new AppError(
          "Total cutting quantity cannot exceed order quantity",
          400,
        );
      }

      const entry = await tx.cuttingEntry.create({
        data,
        include: { productionOrder: true },
      });

      const updatedAggregate = await tx.cuttingEntry.aggregate({
        where: { productionOrderId: order.id },
        _sum: { cuttingQuantity: true },
      });

      await tx.productionOrder.update({
        where: { id: order.id },
        data: {
          cuttingQuantity:
            updatedAggregate._sum.cuttingQuantity ??
            new Prisma.Decimal(0),
        },
      });

      return entry;
    });
  },

  async findMany(
    where: Prisma.CuttingEntryWhereInput,
    skip: number,
    take: number,
  ) {
    return prisma.cuttingEntry.findMany({
      where,
      skip,
      take,
      orderBy: { cuttingDate: "desc" },
      include: {
        productionOrder: {
          select: {
            id: true,
            orderNumber: true,
            styleNumber: true,
            orderQuantity: true,
            cuttingQuantity: true,
            status: true,
          },
        },
      },
    });
  },

  count(where: Prisma.CuttingEntryWhereInput) {
    return prisma.cuttingEntry.count({ where });
  },

  findById(id: string) {
    return prisma.cuttingEntry.findUnique({
      where: { id },
      include: {
        productionOrder: {
          include: {
            buyingHouse: {
              select: { id: true, name: true, code: true },
            },
            buyer: {
              select: { id: true, name: true, buyerCode: true },
            },
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
      },
    });
  },

  findByCuttingNumber(cuttingNumber: string) {
    return prisma.cuttingEntry.findUnique({
      where: { cuttingNumber },
    });
  },

  async update(
    id: string,
    data: Prisma.CuttingEntryUpdateInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.cuttingEntry.findUnique({
        where: { id },
        include: { productionOrder: true },
      });

      if (!existing) {
        throw new AppError("Cutting entry not found", 404);
      }

      const order = existing.productionOrder;

      if (!editableStatuses.includes(order.status)) {
        throw new AppError(
          "Cutting entries cannot be edited at this production stage",
          400,
        );
      }

      const otherEntries = await tx.cuttingEntry.aggregate({
        where: {
          productionOrderId: order.id,
          id: { not: id },
        },
        _sum: { cuttingQuantity: true },
      });

      const otherTotal = otherEntries._sum.cuttingQuantity ??
        new Prisma.Decimal(0);

      const updatedQuantity =
        data.cuttingQuantity !== undefined
          ? new Prisma.Decimal(data.cuttingQuantity as Prisma.Decimal)
          : existing.cuttingQuantity;

      const newTotal = otherTotal.add(updatedQuantity);

      if (newTotal.gt(order.orderQuantity)) {
        throw new AppError(
          "Total cutting quantity cannot exceed order quantity",
          400,
        );
      }

      const updated = await tx.cuttingEntry.update({
        where: { id },
        data,
        include: { productionOrder: true },
      });

      const finalAggregate = await tx.cuttingEntry.aggregate({
        where: { productionOrderId: order.id },
        _sum: { cuttingQuantity: true },
      });

      await tx.productionOrder.update({
        where: { id: order.id },
        data: {
          cuttingQuantity:
            finalAggregate._sum.cuttingQuantity ??
            new Prisma.Decimal(0),
        },
      });

      return updated;
    });
  },

  async getSummary(productionOrderId: string) {
    return prisma.cuttingEntry.aggregate({
      where: { productionOrderId },
      _count: { id: true },
      _sum: {
        cuttingQuantity: true,
        fabricConsumed: true,
      },
    });
  },

  findProductionOrder(id: string) {
    return prisma.productionOrder.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        orderQuantity: true,
        cuttingQuantity: true,
        status: true,
      },
    });
  },
};
