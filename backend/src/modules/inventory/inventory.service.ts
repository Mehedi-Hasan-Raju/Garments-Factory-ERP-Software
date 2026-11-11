import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";
import { inventoryRepository } from "./inventory.repository.js";

import type {
  ReceiveStockInput,
  IssueStockInput,
  TransferStockInput,
  AdjustmentStockInput,
  CountStockInput,
  StockListQuery,
  HistoryQuery,
} from "./inventory.validation.js";

async function validateProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (!product.isActive) {
    throw new AppError("Product is inactive", 400);
  }
}

async function validateBinLocation(locationId: string) {
  const location = await prisma.warehouseLocation.findUnique({
    where: { id: locationId },
    select: {
      id: true,
      type: true,
      warehouseId: true,
    },
  });

  if (!location) {
    throw new AppError("Warehouse location not found", 404);
  }

  if (location.type !== "BIN") {
    throw new AppError("Stock operations are only allowed in BIN locations", 400);
  }

  return location;
}

async function validateBatch(productId: string, batchLotId: string) {
  const batch = await prisma.batchLot.findUnique({
    where: { id: batchLotId },
    select: {
      id: true,
      productId: true,
      isActive: true,
    },
  });

  if (!batch) {
    throw new AppError("Batch/Lot not found", 404);
  }

  if (batch.productId !== productId) {
    throw new AppError("Batch does not belong to this product", 400);
  }

  if (!batch.isActive) {
    throw new AppError("Batch/Lot is inactive", 400);
  }
}

export const inventoryService = {
  async receive(data: ReceiveStockInput, userId: string) {
    await validateProduct(data.productId);
    await validateBinLocation(data.locationId);

    return inventoryRepository.receive(data, userId);
  },

  async issue(data: IssueStockInput, userId: string) {
    await validateProduct(data.productId);
    await validateBinLocation(data.locationId);
    await validateBatch(data.productId, data.batchLotId);

    return inventoryRepository.issue(data, userId);
  },

  async transfer(data: TransferStockInput, userId: string) {
    if (data.fromLocationId === data.toLocationId) {
      throw new AppError("Source and destination locations must be different", 400);
    }

    await validateProduct(data.productId);
    await validateBatch(data.productId, data.batchLotId);

    await Promise.all([
      validateBinLocation(data.fromLocationId),
      validateBinLocation(data.toLocationId),
    ]);

    return inventoryRepository.transfer(data, userId);
  },

  async adjust(data: AdjustmentStockInput, userId: string) {
    await validateProduct(data.productId);
    await validateBinLocation(data.locationId);
    await validateBatch(data.productId, data.batchLotId);

    return inventoryRepository.adjust(data, userId);
  },

  async count(data: CountStockInput, userId: string) {
    await validateProduct(data.productId);
    await validateBinLocation(data.locationId);
    await validateBatch(data.productId, data.batchLotId);

    return inventoryRepository.count(data, userId);
  },

  async findStock(query: StockListQuery) {
    const { stocks, total } = await inventoryRepository.findStock(query);

    return {
      stocks,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
        hasNextPage: query.page * query.limit < total,
        hasPreviousPage: query.page > 1,
      },
    };
  },

  async findLowStock() {
    return inventoryRepository.findLowStock();
  },

  async findHistory(query: HistoryQuery) {
    const { movements, total } = await inventoryRepository.findHistory(query);

    return {
      movements,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
        hasNextPage: query.page * query.limit < total,
        hasPreviousPage: query.page > 1,
      },
    };
  },
};
