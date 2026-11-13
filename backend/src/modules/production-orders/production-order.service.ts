import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/app-error.js";

import { productionOrderRepository } from "./production-order.repository.js";
import { notifyRoles } from "../../lib/automatic-notification.js";

import type {
  CreateProductionOrderInput,
  ProductionOrderProgressInput,
  ProductionOrderQuery,
  ProductionOrderStatusInput,
  UpdateProductionOrderInput,
} from "./production-order.validation.js";

const statusFlow = [
  "PENDING",
  "CUTTING",
  "SEWING",
  "QC",
  "COMPLETED",
  "SHIPPED",
  "DELIVERED",
] as const;

type OrderStatus = (typeof statusFlow)[number] | "CANCELLED";

function decimal(value: Prisma.Decimal | number | string) {
  return new Prisma.Decimal(value);
}

async function validateReferences(
  buyingHouseId: string,
  buyerId: string,
  productId: string,
) {
  const [buyingHouse, buyer, product] = await Promise.all([
    productionOrderRepository.findBuyingHouse(buyingHouseId),
    productionOrderRepository.findBuyer(buyerId),
    productionOrderRepository.findProduct(productId),
  ]);

  if (!buyingHouse || !buyingHouse.isActive) {
    throw new AppError("Active Buying House not found", 404);
  }

  if (!buyer || !buyer.isActive) {
    throw new AppError("Active Buyer not found", 404);
  }

  if (buyer.buyingHouseId !== buyingHouseId) {
    throw new AppError(
      "Selected Buyer does not belong to the selected Buying House",
      400,
    );
  }

  if (!product || !product.isActive) {
    throw new AppError("Active Product not found", 404);
  }
}

function validateProgress(
  orderQuantity: Prisma.Decimal,
  cuttingQuantity: Prisma.Decimal,
  sewingQuantity: Prisma.Decimal,
  rejectedQuantity: Prisma.Decimal,
  finishedGoodsQuantity: Prisma.Decimal,
) {
  if (cuttingQuantity.gt(orderQuantity)) {
    throw new AppError(
      "Cutting quantity cannot exceed order quantity",
      400,
    );
  }

  if (sewingQuantity.gt(cuttingQuantity)) {
    throw new AppError(
      "Sewing quantity cannot exceed cutting quantity",
      400,
    );
  }

  if (rejectedQuantity.gt(sewingQuantity)) {
    throw new AppError(
      "Rejected quantity cannot exceed sewing quantity",
      400,
    );
  }

  const acceptableQuantity = sewingQuantity.minus(rejectedQuantity);

  if (finishedGoodsQuantity.gt(acceptableQuantity)) {
    throw new AppError(
      "Finished goods quantity cannot exceed accepted sewing quantity",
      400,
    );
  }
}

export const productionOrderService = {
  async create(data: CreateProductionOrderInput, userId: string) {
    const existing = await productionOrderRepository.findByOrderNumber(
      data.orderNumber,
    );

    if (existing) {
      throw new AppError("Production order number already exists", 409);
    }

    await validateReferences(
      data.buyingHouseId,
      data.buyerId,
      data.productId,
    );

    const orderValue = decimal(data.orderQuantity).mul(
      decimal(data.targetPrice),
    );

    const created = await productionOrderRepository.create({
      orderNumber: data.orderNumber,

      buyingHouseId: data.buyingHouseId,
      buyerId: data.buyerId,
      productId: data.productId,

      styleNumber: data.styleNumber,
      designImageUrl: data.designImageUrl,

      orderQuantity: decimal(data.orderQuantity),

      fabricRequirement: decimal(data.fabricRequirement),
      fabricRequirementUnit: data.fabricRequirementUnit,

      targetPrice: decimal(data.targetPrice),
      orderValue,
      currency: data.currency,

      paymentTerms: data.paymentTerms,

      ...(data.orderDate && { orderDate: data.orderDate }),
      deliveryDate: data.deliveryDate,

      notes: data.notes,

      createdById: userId,
    });

    await notifyRoles(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"], {
      title: "Production Order Created",
      message: `Production order ${created.orderNumber} has been created.`,
      type: "PRODUCTION",
      actionUrl: `/production-orders/${created.id}`,
    });
    return created;
  },

  async findMany(query: ProductionOrderQuery) {
    const where: Prisma.ProductionOrderWhereInput = {
      ...(query.status && {
        status: query.status,
      }),

      ...(query.shipmentStatus && {
        shipmentStatus: query.shipmentStatus,
      }),

      ...(query.buyingHouseId && {
        buyingHouseId: query.buyingHouseId,
      }),

      ...(query.buyerId && {
        buyerId: query.buyerId,
      }),

      ...(query.productId && {
        productId: query.productId,
      }),

      ...(query.fromDate || query.toDate
        ? {
            orderDate: {
              ...(query.fromDate && { gte: query.fromDate }),
              ...(query.toDate && { lte: query.toDate }),
            },
          }
        : {}),

      ...(query.search && {
        OR: [
          {
            orderNumber: {
              contains: query.search,
              mode: "insensitive",
            },
          },
          {
            styleNumber: {
              contains: query.search,
              mode: "insensitive",
            },
          },
          {
            buyingHouse: {
              name: {
                contains: query.search,
                mode: "insensitive",
              },
            },
          },
          {
            buyer: {
              name: {
                contains: query.search,
                mode: "insensitive",
              },
            },
          },
          {
            product: {
              name: {
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
      productionOrderRepository.findMany(where, skip, query.limit),
      productionOrderRepository.count(where),
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
    const order = await productionOrderRepository.findById(id);

    if (!order) {
      throw new AppError("Production order not found", 404);
    }

    return order;
  },

  async update(id: string, data: UpdateProductionOrderInput) {
    const order = await this.findById(id);

    if (order.status !== "PENDING") {
      throw new AppError(
        "Only pending production orders can be edited",
        400,
      );
    }

    const buyingHouseId = data.buyingHouseId ?? order.buyingHouseId;
    const buyerId = data.buyerId ?? order.buyerId;
    const productId = data.productId ?? order.productId;

    await validateReferences(buyingHouseId, buyerId, productId);

    const orderDate = data.orderDate ?? order.orderDate;
    const deliveryDate = data.deliveryDate ?? order.deliveryDate;

    if (deliveryDate < orderDate) {
      throw new AppError(
        "Delivery date cannot be before order date",
        400,
      );
    }

    const orderQuantity = decimal(
      data.orderQuantity ?? order.orderQuantity,
    );

    const targetPrice = decimal(
      data.targetPrice ?? order.targetPrice,
    );

    const orderValue = orderQuantity.mul(targetPrice);

    return productionOrderRepository.update(id, {
      ...data,
      orderQuantity,
      targetPrice,
      orderValue,
    });
  },

  async updateProgress(
    id: string,
    data: ProductionOrderProgressInput,
  ) {
    const order = await this.findById(id);

    if (
      order.status === "CANCELLED" ||
      order.status === "DELIVERED"
    ) {
      throw new AppError(
        "Production progress cannot be changed for this order",
        400,
      );
    }

    const cuttingQuantity = decimal(
      data.cuttingQuantity ?? order.cuttingQuantity,
    );

    const sewingQuantity = decimal(
      data.sewingQuantity ?? order.sewingQuantity,
    );

    const rejectedQuantity = decimal(
      data.rejectedQuantity ?? order.rejectedQuantity,
    );

    const finishedGoodsQuantity = decimal(
      data.finishedGoodsQuantity ?? order.finishedGoodsQuantity,
    );

    validateProgress(
      decimal(order.orderQuantity),
      cuttingQuantity,
      sewingQuantity,
      rejectedQuantity,
      finishedGoodsQuantity,
    );

    const updated = await productionOrderRepository.update(id, {
      ...(data.cuttingQuantity !== undefined && {
        cuttingQuantity,
      }),

      ...(data.sewingQuantity !== undefined && {
        sewingQuantity,
      }),

      ...(data.rejectedQuantity !== undefined && {
        rejectedQuantity,
      }),

      ...(data.finishedGoodsQuantity !== undefined && {
        finishedGoodsQuantity,
      }),
    });
    await notifyRoles(["OWNER", "ADMIN", "MANAGER"], {
      title: "Production Progress Updated",
      message: `Production progress updated for order ${order.orderNumber}.`,
      type: "PRODUCTION",
      actionUrl: `/production-orders/${id}`,
    });
    return updated;
  },

  async updateStatus(
    id: string,
    data: ProductionOrderStatusInput,
  ) {
    const order = await this.findById(id);

    const currentStatus = order.status as OrderStatus;
    const nextStatus = data.status as OrderStatus;

    if (
      currentStatus === "CANCELLED" ||
      currentStatus === "DELIVERED"
    ) {
      throw new AppError(
        "This production order is already in a terminal status",
        400,
      );
    }

    if (nextStatus === "CANCELLED") {
      const cancelled = await productionOrderRepository.update(id, { status: "CANCELLED" });
      await notifyRoles(["OWNER", "ADMIN", "MANAGER"], {
        title: "Production Order Cancelled",
        message: `Production order ${order.orderNumber} has been cancelled.`,
        type: "PRODUCTION",
        actionUrl: `/production-orders/${id}`,
      });
      return cancelled;
    }

    const currentIndex = statusFlow.indexOf(
      currentStatus as (typeof statusFlow)[number],
    );

    const nextIndex = statusFlow.indexOf(
      nextStatus as (typeof statusFlow)[number],
    );

    if (nextIndex !== currentIndex + 1) {
      throw new AppError(
        "Invalid status transition. Follow the production order workflow",
        400,
      );
    }

    if (
      nextStatus === "CUTTING" &&
      !decimal(order.cuttingQuantity).gt(0)
    ) {
      throw new AppError(
        "Update cutting quantity before moving to CUTTING",
        400,
      );
    }

    if (
      nextStatus === "SEWING" &&
      !decimal(order.sewingQuantity).gt(0)
    ) {
      throw new AppError(
        "Update sewing quantity before moving to SEWING",
        400,
      );
    }

    if (
      nextStatus === "QC" &&
      !decimal(order.sewingQuantity).gt(0)
    ) {
      throw new AppError(
        "Sewing quantity is required before QC",
        400,
      );
    }

    if (
      nextStatus === "COMPLETED" &&
      !decimal(order.finishedGoodsQuantity).gt(0)
    ) {
      throw new AppError(
        "Finished goods quantity is required before completion",
        400,
      );
    }
    

    const updateData: Prisma.ProductionOrderUncheckedUpdateInput = {
      status: nextStatus,
    };

    if (nextStatus === "COMPLETED") {
      updateData.shipmentStatus = "READY";
    }

    if (nextStatus === "SHIPPED") {
      updateData.shipmentStatus = "SHIPPED";
    }

    if (nextStatus === "DELIVERED") {
      updateData.shipmentStatus = "DELIVERED";
    }


    const updated = await productionOrderRepository.update(id, updateData);
    await notifyRoles(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STOREKEEPER"], {
      title: "Production Order Status Changed",
      message: `Production order ${order.orderNumber} moved from ${currentStatus} to ${nextStatus}.`,
      type: "PRODUCTION",
      actionUrl: `/production-orders/${id}`,
    });
    return updated;
  },
};