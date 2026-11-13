import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";
import { inventoryRepository } from "./inventory.repository.js";
import { notifyRoles } from "../../lib/automatic-notification.js";

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


async function notifyLowStock(productId: string) {
  try {
    const stocks = await prisma.inventoryStock.findMany({
      where: { productId },
      include: { product: { select: { name: true } } },
    });

    for (const stock of stocks) {
      if (stock.quantity.lte(stock.minimumStock)) {
        await notifyRoles(
          ["OWNER", "ADMIN", "MANAGER", "STOREKEEPER"],
          {
            title: "Low Stock Alert",
            message: `${stock.product.name} has reached its minimum stock level. Current quantity: ${stock.quantity.toString()}.`,
            type: "INVENTORY",
            actionUrl: `/inventory?productId=${productId}`,
            deduplicateUnread: true,
          },
        );
      }
    }
  } catch (error) {
    console.error("[inventory-notification] Low-stock check failed:", error);
  }
}

export const inventoryService = {
  async receive(data: ReceiveStockInput, userId: string) {
    await validateProduct(data.productId);
    await validateBinLocation(data.locationId);

    const result = await inventoryRepository.receive(data, userId);
    await notifyRoles(["OWNER", "ADMIN", "MANAGER", "STOREKEEPER"], {
      title: "Stock Received",
      message: `Stock received for product ${data.productId}. Quantity: ${data.quantity}.`,
      type: "INVENTORY",
      actionUrl: "/inventory",
    });
    await notifyLowStock(data.productId);
    return result;
  },



  async issue(data: IssueStockInput, userId: string) {
    await validateProduct(data.productId);
    await validateBinLocation(data.locationId);
    await validateBatch(data.productId, data.batchLotId);

    const result = await inventoryRepository.issue(data, userId);
    await notifyRoles(["OWNER", "ADMIN", "MANAGER", "STOREKEEPER"], {
      title: "Stock Issued",
      message: `Stock issued for product ${data.productId}. Quantity: ${data.quantity}.`,
      type: "INVENTORY",
      actionUrl: "/inventory",
    });
    await notifyLowStock(data.productId);
    return result;
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

    const result = await inventoryRepository.transfer(data, userId);
    await notifyRoles(["OWNER", "ADMIN", "MANAGER", "STOREKEEPER"], {
      title: "Stock Transferred",
      message: `Stock transferred for product ${data.productId}. Quantity: ${data.quantity}.`,
      type: "INVENTORY",
      actionUrl: "/inventory",
    });
    await notifyLowStock(data.productId);
    return result;
  },

  
  async adjust(data: AdjustmentStockInput, userId: string) {
    await validateProduct(data.productId);
    await validateBinLocation(data.locationId);
    await validateBatch(data.productId, data.batchLotId);

    const result = await inventoryRepository.adjust(data, userId);
    await notifyRoles(["OWNER", "ADMIN", "MANAGER", "STOREKEEPER"], {
      title: "Stock Adjusted",
      message: `Stock quantity adjusted for product ${data.productId}.`,
      type: "INVENTORY",
      actionUrl: "/inventory",
    });
    await notifyLowStock(data.productId);
    return result;
  },

  async count(data: CountStockInput, userId: string) {
    await validateProduct(data.productId);
    await validateBinLocation(data.locationId);
    await validateBatch(data.productId, data.batchLotId);

    const result = await inventoryRepository.count(data, userId);
    await notifyRoles(["OWNER", "ADMIN", "MANAGER", "STOREKEEPER"], {
      title: "Stock Count Completed",
      message: `Physical stock count completed for product ${data.productId}.`,
      type: "INVENTORY",
      actionUrl: "/inventory",
    });
    await notifyLowStock(data.productId);
    return result;
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
