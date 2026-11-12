import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/app-error.js";
import { finishedGoodsRepository } from "./finished-goods.repository.js";
import {
  createFinishedGoodsSchema,
  finishedGoodsIdSchema,
  finishedGoodsListQuerySchema,
  stockMovementSchema,
  type CreateFinishedGoodsInput,
  type StockMovementInput,
} from "./finished-goods.validation.js";

function handleFinishedGoodsError(error: unknown): never {
  if (error instanceof Error) {
    const errors: Record<string, [string, number]> = {
      QC_INSPECTION_NOT_FOUND: ["QC inspection not found", 404],
      NO_PASSED_QUANTITY: ["QC inspection has no passed quantity", 400],
      QC_ALREADY_RECEIVED: [
        "Finished goods already received for this QC inspection",
        409,
      ],
      WAREHOUSE_NOT_FOUND: ["Warehouse not found", 404],
      WAREHOUSE_LOCATION_NOT_FOUND: ["Warehouse location not found", 404],
      LOCATION_WAREHOUSE_MISMATCH: [
        "Selected location does not belong to this warehouse",
        400,
      ],
      FINISHED_GOODS_NOT_FOUND: ["Finished goods entry not found", 404],
      INSUFFICIENT_AVAILABLE_STOCK: [
        "Insufficient available stock",
        400,
      ],
      INSUFFICIENT_RESERVED_STOCK: [
        "Insufficient reserved stock",
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
    throw new AppError(
      "Finished goods number or QC inspection already exists",
      409,
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    throw new AppError(
      "Concurrent stock update detected. Please try again.",
      409,
    );
  }

  throw error;
}

export const finishedGoodsService = {
  async create(input: unknown, createdById: string) {
    const parsed = createFinishedGoodsSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid finished goods data",
        400,
      );
    }

    const data: CreateFinishedGoodsInput = parsed.data;

    const duplicate = await finishedGoodsRepository.findByNumber(
      data.finishedGoodsNumber,
    );

    if (duplicate) {
      throw new AppError("Finished goods number already exists", 409);
    }

    try {
      return await finishedGoodsRepository.create(data, createdById);
    } catch (error) {
      handleFinishedGoodsError(error);
    }
  },

  async findAll(query: unknown) {
    const parsed = finishedGoodsListQuerySchema.safeParse(query);

    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid query",
        400,
      );
    }

    const { page, limit, search, productionOrderId, warehouseId } =
      parsed.data;

    const where: Prisma.FinishedGoodsEntryWhereInput = {
      ...(productionOrderId && { productionOrderId }),
      ...(warehouseId && { warehouseId }),
      ...(search && {
        OR: [
          {
            finishedGoodsNumber: {
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
            qcInspection: {
              is: {
                qcNumber: {
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
      finishedGoodsRepository.findMany(where, skip, limit),
      finishedGoodsRepository.count(where),
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
    const parsed = finishedGoodsIdSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("Invalid finished goods ID", 400);
    }

    const entry = await finishedGoodsRepository.findById(parsed.data.id);

    if (!entry) {
      throw new AppError("Finished goods entry not found", 404);
    }

    return entry;
  },

  async createMovement(
    idInput: unknown,
    input: unknown,
    createdById: string,
  ) {
    const idParsed = finishedGoodsIdSchema.safeParse(idInput);

    if (!idParsed.success) {
      throw new AppError("Invalid finished goods ID", 400);
    }

    const parsed = stockMovementSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid stock movement",
        400,
      );
    }

    try {
      return await finishedGoodsRepository.createMovement(
        idParsed.data.id,
        parsed.data as StockMovementInput,
        createdById,
      );
    } catch (error) {
      handleFinishedGoodsError(error);
    }
  },

  async getProductionOrderSummary(input: unknown) {
    const parsed = finishedGoodsIdSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("Invalid production order ID", 400);
    }

    return finishedGoodsRepository.getProductionOrderSummary(
      parsed.data.id,
    );
  },
};