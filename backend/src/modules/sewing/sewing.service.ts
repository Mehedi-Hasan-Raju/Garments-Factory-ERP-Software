import { AppError } from "../../lib/app-error.js";
import { sewingRepository } from "./sewing.repository.js";
import { notifyRoles } from "../../lib/automatic-notification.js";
import {
  createSewingSchema,
  updateSewingSchema,
  sewingIdSchema,
  sewingListQuerySchema,
  productionOrderIdSchema,
  type CreateSewingInput,
  type UpdateSewingInput,
} from "./sewing.validation.js";
import { Prisma } from "../../generated/prisma/client.js";

function handleRepositoryError(error: unknown): never {
  if (error instanceof Error) {
    switch (error.message) {
      case "PRODUCTION_ORDER_NOT_FOUND":
        throw new AppError("Production order not found", 404);
      case "SEWING_ENTRY_NOT_FOUND":
        throw new AppError("Sewing entry not found", 404);
      case "INVALID_PRODUCTION_ORDER_STATUS":
        throw new AppError(
          "Sewing is allowed only when production order status is CUTTING or SEWING",
          400,
        );
      case "CUTTING_NOT_STARTED":
        throw new AppError(
          "Cutting must be started before sewing",
          400,
        );
      case "SEWING_EXCEEDS_CUTTING":
        throw new AppError(
          "Total sewing quantity cannot exceed cutting quantity",
          400,
        );
    }
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError("Sewing number already exists", 409);
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    throw new AppError(
      "Concurrent update detected. Please try again.",
      409,
    );
  }

  throw error;
}

export const sewingService = {
  async create(input: unknown, createdById: string) {
    const parsed = createSewingSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const data: CreateSewingInput = parsed.data;

    const duplicate = await sewingRepository.findBySewingNumber(
      data.sewingNumber,
    );

    if (duplicate) {
      throw new AppError("Sewing number already exists", 409);
    }

    try {
      const created = await sewingRepository.create(data, createdById);
      await notifyRoles(["OWNER", "ADMIN", "MANAGER"], {
        title: "Sewing Entry Recorded",
        message: `Sewing entry ${created.sewingNumber} was recorded for production order ${data.productionOrderId}.`,
        type: "PRODUCTION",
        actionUrl: `/sewing/${created.id}`,
      });
      return created;
    } catch (error) {
      handleRepositoryError(error);
    }
  },

  async findAll(query: unknown) {
    const parsed = sewingListQuerySchema.safeParse(query);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }

    const { page, limit, search, productionOrderId, fromDate, toDate } =
      parsed.data;

    if (fromDate && toDate && fromDate > toDate) {
      throw new AppError("fromDate cannot be later than toDate", 400);
    }

    const where: Prisma.SewingEntryWhereInput = {
      ...(productionOrderId && { productionOrderId }),
      ...(fromDate || toDate
        ? {
            sewingDate: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          {
            sewingNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            sewingLine: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            productionOrder: {
              is: {
                orderNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            productionOrder: {
              is: {
                styleNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      }),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      sewingRepository.findMany(where, skip, limit),
      sewingRepository.count(where),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(input: unknown) {
    const parsed = sewingIdSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("Invalid sewing entry ID", 400);
    }

    const entry = await sewingRepository.findById(parsed.data.id);

    if (!entry) {
      throw new AppError("Sewing entry not found", 404);
    }

    return entry;
  },

  async update(idInput: unknown, input: unknown) {
    const idParsed = sewingIdSchema.safeParse(idInput);

    if (!idParsed.success) {
      throw new AppError("Invalid sewing entry ID", 400);
    }

    const parsed = updateSewingSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const id = idParsed.data.id;
    const data: UpdateSewingInput = parsed.data;

    const existing = await sewingRepository.findById(id);

    if (!existing) {
      throw new AppError("Sewing entry not found", 404);
    }

    if (data.sewingNumber) {
      const duplicate = await sewingRepository.findBySewingNumber(
        data.sewingNumber,
      );

      if (duplicate && duplicate.id !== id) {
        throw new AppError("Sewing number already exists", 409);
      }
    }

    try {
      return await sewingRepository.update(id, data);
    } catch (error) {
      handleRepositoryError(error);
    }
  },

  async getProductionOrderSummary(input: unknown) {
    const parsed = productionOrderIdSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("Invalid production order ID", 400);
    }

    const summary = await sewingRepository.getProductionOrderSummary(
      parsed.data.productionOrderId,
    );

    if (!summary) {
      throw new AppError("Production order not found", 404);
    }

    const cuttingQuantity = new Prisma.Decimal(summary.cuttingQuantity);
    const sewingQuantity = new Prisma.Decimal(summary.sewingQuantity);

    return {
      ...summary,
      remainingSewingCapacity: cuttingQuantity.minus(sewingQuantity),
      sewingProgressPercentage: cuttingQuantity.isZero()
        ? 0
        : Number(
            sewingQuantity
              .dividedBy(cuttingQuantity)
              .mul(100)
              .toFixed(2),
          ),
    };
  },
};