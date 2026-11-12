import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/app-error.js";
import { qcRepository } from "./qc.repository.js";
import {
  createQCInspectionSchema,
  qcIdSchema,
  qcListQuerySchema,
  productionOrderIdSchema,
  type CreateQCInspectionInput,
} from "./qc.validation.js";

function handleQCError(error: unknown): never {
  if (error instanceof Error) {
    const errors: Record<string, [string, number]> = {
      PRODUCTION_ORDER_NOT_FOUND: ["Production order not found", 404],
      INVALID_PRODUCTION_ORDER_STATUS: [
        "QC is allowed only when production order status is SEWING or QC",
        400,
      ],
      QC_QUANTITY_MISMATCH: [
        "Passed + Rejected + Rework quantity must equal inspected quantity",
        400,
      ],
      QC_EXCEEDS_SEWING: [
        "Total QC inspected quantity cannot exceed sewing quantity",
        400,
      ],
      DEFECT_EXCEEDS_REJECTED: [
        "Total defect quantity cannot exceed rejected quantity",
        400,
      ],
    };

    const matched = errors[error.message];

    if (matched) {
      throw new AppError(matched[0], matched[1]);
    }
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError("QC number already exists", 409);
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    throw new AppError("Concurrent QC update. Please try again.", 409);
  }

  throw error;
}

export const qcService = {
  async create(input: unknown, createdById: string) {
    const parsed = createQCInspectionSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid QC data",
        400,
      );
    }

    const data: CreateQCInspectionInput = parsed.data;

    const duplicate = await qcRepository.findByQCNumber(data.qcNumber);

    if (duplicate) {
      throw new AppError("QC number already exists", 409);
    }

    try {
      return await qcRepository.create(data, createdById);
    } catch (error) {
      handleQCError(error);
    }
  },

  async findAll(query: unknown) {
    const parsed = qcListQuerySchema.safeParse(query);

    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid query",
        400,
      );
    }

    const {
      page,
      limit,
      search,
      productionOrderId,
      fromDate,
      toDate,
    } = parsed.data;

    if (fromDate && toDate && fromDate > toDate) {
      throw new AppError("fromDate cannot be later than toDate", 400);
    }

    const where: Prisma.QCInspectionWhereInput = {
      ...(productionOrderId && { productionOrderId }),
      ...(fromDate || toDate
        ? {
            inspectionDate: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          {
            qcNumber: {
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
        ],
      }),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      qcRepository.findMany(where, skip, limit),
      qcRepository.count(where),
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
    const parsed = qcIdSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("Invalid QC inspection ID", 400);
    }

    const inspection = await qcRepository.findById(parsed.data.id);

    if (!inspection) {
      throw new AppError("QC inspection not found", 404);
    }

    return inspection;
  },

  async getProductionOrderSummary(input: unknown) {
    const parsed = productionOrderIdSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("Invalid production order ID", 400);
    }

    return qcRepository.getProductionOrderSummary(
      parsed.data.productionOrderId,
    );
  },
};