import { AppError } from "../../lib/app-error.js";
import { cuttingRepository } from "./cutting.repository.js";

import type {
  CreateCuttingInput,
  CuttingQuery,
  UpdateCuttingInput,
} from "./cutting.validation.js";

import { Prisma } from "../../generated/prisma/client.js";

export const cuttingService = {
  async create(data: CreateCuttingInput, userId: string) {
    const existing = await cuttingRepository.findByCuttingNumber(
      data.cuttingNumber,
    );

    if (existing) {
      throw new AppError("Cutting number already exists", 409);
    }

    return cuttingRepository.create({
      cuttingNumber: data.cuttingNumber,
      productionOrderId: data.productionOrderId,
      cuttingDate: data.cuttingDate,
      cuttingQuantity: new Prisma.Decimal(data.cuttingQuantity),
      fabricConsumed: new Prisma.Decimal(data.fabricConsumed),
      fabricConsumedUnit: data.fabricConsumedUnit,
      notes: data.notes,
      createdById: userId,
    });
  },

  async findMany(query: CuttingQuery) {
    const where: Prisma.CuttingEntryWhereInput = {
      ...(query.productionOrderId && {
        productionOrderId: query.productionOrderId,
      }),

      ...(query.fromDate || query.toDate
        ? {
            cuttingDate: {
              ...(query.fromDate && { gte: query.fromDate }),
              ...(query.toDate && { lte: query.toDate }),
            },
          }
        : {}),

      ...(query.search && {
        OR: [
          {
            cuttingNumber: {
              contains: query.search,
              mode: "insensitive",
            },
          },
          {
            productionOrder: {
              orderNumber: {
                contains: query.search,
                mode: "insensitive",
              },
            },
          },
          {
            productionOrder: {
              styleNumber: {
                contains: query.search,
                mode: "insensitive",
              },
            },
          },
        ],
      }),
    };

    const skip = (query.page - 1) * query.limit;

    const [data, total] = await Promise.all([
      cuttingRepository.findMany(where, skip, query.limit),
      cuttingRepository.count(where),
    ]);

    return {
      data,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async findById(id: string) {
    const entry = await cuttingRepository.findById(id);

    if (!entry) {
      throw new AppError("Cutting entry not found", 404);
    }

    return entry;
  },

  async update(id: string, data: UpdateCuttingInput) {
    await this.findById(id);

    return cuttingRepository.update(id, {
      ...(data.cuttingDate !== undefined && {
        cuttingDate: data.cuttingDate,
      }),
      ...(data.cuttingQuantity !== undefined && {
        cuttingQuantity: new Prisma.Decimal(data.cuttingQuantity),
      }),
      ...(data.fabricConsumed !== undefined && {
        fabricConsumed: new Prisma.Decimal(data.fabricConsumed),
      }),
      ...(data.fabricConsumedUnit !== undefined && {
        fabricConsumedUnit: data.fabricConsumedUnit,
      }),
      ...(data.notes !== undefined && {
        notes: data.notes,
      }),
    });
  },

  async getSummary(productionOrderId: string) {
    const order = await cuttingRepository.findProductionOrder(
      productionOrderId,
    );

    if (!order) {
      throw new AppError("Production order not found", 404);
    }

    const summary = await cuttingRepository.getSummary(productionOrderId);

    const totalCutting = summary._sum.cuttingQuantity ??
      new Prisma.Decimal(0);

    const remainingQuantity = new Prisma.Decimal(order.orderQuantity)
      .minus(totalCutting);

    return {
      productionOrder: order,
      totalEntries: summary._count.id,
      totalCuttingQuantity: totalCutting,
      totalFabricConsumed:
        summary._sum.fabricConsumed ?? new Prisma.Decimal(0),
      remainingQuantity,
    };
  },
};
