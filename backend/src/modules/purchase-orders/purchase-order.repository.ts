import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { randomUUID } from "node:crypto";

import type {
  CreatePurchaseOrderInput,
  PurchaseOrderQuery,
  ReceivePurchaseOrderInput,
  UpdatePurchaseOrderInput,
} from "./purchase-order.validation.js";

const purchaseOrderInclude = {
  supplier: true,
  warehouse: true,
  items: {
    include: {
      product: {
        include: {
          category: true,
          unit: true,
        },
      },
    },
  },
};

export const purchaseOrderRepository = {
  async create(data: CreatePurchaseOrderInput, createdById: string) {
    return prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findFirst({
        where: { id: data.supplierId, isActive: true },
      });

      if (!supplier) {
        throw new Error("SUPPLIER_NOT_FOUND");
      }

      const warehouse = await tx.warehouse.findFirst({
        where: { id: data.warehouseId, isActive: true },
      });

      if (!warehouse) {
        throw new Error("WAREHOUSE_NOT_FOUND");
      }

      const productIds = [...new Set(data.items.map((item) => item.productId))];

      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
        select: { id: true },
      });

      if (products.length !== productIds.length) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const subtotal = data.items.reduce(
        (sum, item) =>
          sum.plus(
            new Prisma.Decimal(item.quantity).mul(
              new Prisma.Decimal(item.unitPrice),
            ),
          ),
        new Prisma.Decimal(0),
      );

      const discount = new Prisma.Decimal(data.discount);
      const tax = new Prisma.Decimal(data.tax);
      const totalAmount = subtotal.minus(discount).plus(tax);

      if (totalAmount.lessThan(0)) {
        throw new Error("INVALID_TOTAL_AMOUNT");
      }

      return tx.purchaseOrder.create({
        data: {
          poNumber: data.poNumber,
          supplierId: data.supplierId,
          warehouseId: data.warehouseId,
          orderDate: data.orderDate,
          expectedDeliveryDate: data.expectedDeliveryDate,
          subtotal,
          discount,
          tax,
          totalAmount,
          notes: data.notes,
          termsAndConditions: data.termsAndConditions,
          createdById,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: new Prisma.Decimal(item.quantity),
              unitPrice: new Prisma.Decimal(item.unitPrice),
              lineTotal: new Prisma.Decimal(item.quantity).mul(
                new Prisma.Decimal(item.unitPrice),
              ),
              notes: item.notes,
            })),
          },
        },
        include: purchaseOrderInclude,
      });
    });
  },

  async findMany(query: PurchaseOrderQuery) {
    const {
      search,
      status,
      supplierId,
      warehouseId,
      fromDate,
      toDate,
      page,
      limit,
    } = query;

    const where: Prisma.PurchaseOrderWhereInput = {
      ...(status && { status }),
      ...(supplierId && { supplierId }),
      ...(warehouseId && { warehouseId }),
      ...((fromDate || toDate) && {
        orderDate: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
      }),
      ...(search && {
        OR: [
          { poNumber: { contains: search, mode: "insensitive" } },
          {
            supplier: {
              supplierName: { contains: search, mode: "insensitive" },
            },
          },
          {
            supplier: {
              companyName: { contains: search, mode: "insensitive" },
            },
          },
        ],
      }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.purchaseOrder.findMany({
        where,
        include: purchaseOrderInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
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

  async findById(id: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: purchaseOrderInclude,
    });
  },

  async update(id: string, data: UpdatePurchaseOrderInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existing) throw new Error("PURCHASE_ORDER_NOT_FOUND");
      if (existing.status !== "DRAFT") {
        throw new Error("ONLY_DRAFT_CAN_BE_UPDATED");
      }

      let subtotal = existing.subtotal;

      if (data.items) {
        const productIds = [...new Set(data.items.map((item) => item.productId))];

        const products = await tx.product.findMany({
          where: { id: { in: productIds }, isActive: true },
          select: { id: true },
        });

        if (products.length !== productIds.length) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        subtotal = data.items.reduce(
          (sum, item) =>
            sum.plus(
              new Prisma.Decimal(item.quantity).mul(
                new Prisma.Decimal(item.unitPrice),
              ),
            ),
          new Prisma.Decimal(0),
        );

        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id },
        });

        await tx.purchaseOrderItem.createMany({
          data: data.items.map((item) => ({
            purchaseOrderId: id,
            productId: item.productId,
            quantity: new Prisma.Decimal(item.quantity),
            unitPrice: new Prisma.Decimal(item.unitPrice),
            lineTotal: new Prisma.Decimal(item.quantity).mul(
              new Prisma.Decimal(item.unitPrice),
            ),
            notes: item.notes,
          })),
        });
      }

      const discount = new Prisma.Decimal(data.discount ?? existing.discount);
      const tax = new Prisma.Decimal(data.tax ?? existing.tax);
      const totalAmount = subtotal.minus(discount).plus(tax);

      if (totalAmount.lessThan(0)) {
        throw new Error("INVALID_TOTAL_AMOUNT");
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: {
          ...(data.expectedDeliveryDate !== undefined && {
            expectedDeliveryDate: data.expectedDeliveryDate,
          }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.termsAndConditions !== undefined && {
            termsAndConditions: data.termsAndConditions,
          }),
          subtotal,
          discount,
          tax,
          totalAmount,
        },
        include: purchaseOrderInclude,
      });
    });
  },

  async submit(id: string) {
    const result = await prisma.purchaseOrder.updateMany({
      where: { id, status: "DRAFT" },
      data: { status: "PENDING_APPROVAL" },
    });

    if (result.count === 0) {
      const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
      if (!existing) throw new Error("PURCHASE_ORDER_NOT_FOUND");
      throw new Error("INVALID_PURCHASE_ORDER_STATUS");
    }

    return this.findById(id);
  },

  async approve(id: string, approvedById: string) {
    const result = await prisma.purchaseOrder.updateMany({
      where: { id, status: "PENDING_APPROVAL" },
      data: {
        status: "APPROVED",
        approvedById,
        approvedAt: new Date(),
      },
    });

    if (result.count === 0) {
      const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
      if (!existing) throw new Error("PURCHASE_ORDER_NOT_FOUND");
      throw new Error("INVALID_PURCHASE_ORDER_STATUS");
    }

    return this.findById(id);
  },

  async cancel(id: string) {
    const result = await prisma.purchaseOrder.updateMany({
      where: {
        id,
        status: {
          in: ["DRAFT", "PENDING_APPROVAL", "APPROVED"],
        },
      },
      data: { status: "CANCELLED" },
    });

    if (result.count === 0) {
      const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
      if (!existing) throw new Error("PURCHASE_ORDER_NOT_FOUND");
      throw new Error("PURCHASE_ORDER_CANNOT_BE_CANCELLED");
    }

    return this.findById(id);
  },

  async receive(
    id: string,
    data: ReceivePurchaseOrderInput,
    createdById: string,
  ) {
    return prisma.$transaction(
      async (tx) => {
        const purchaseOrder = await tx.purchaseOrder.findUnique({
          where: { id },
          include: { items: true },
        });

        if (!purchaseOrder) throw new Error("PURCHASE_ORDER_NOT_FOUND");

        if (!["APPROVED", "PARTIALLY_RECEIVED"].includes(purchaseOrder.status)) {
          throw new Error("PURCHASE_ORDER_NOT_READY_FOR_RECEIVING");
        }

        for (const receivedItem of data.items) {
          const poItem = purchaseOrder.items.find(
            (item) => item.id === receivedItem.purchaseOrderItemId,
          );

          if (!poItem) throw new Error("PURCHASE_ORDER_ITEM_NOT_FOUND");

          const remaining = poItem.quantity.minus(poItem.receivedQuantity);
          const receiveQuantity = new Prisma.Decimal(receivedItem.quantity);

          if (receiveQuantity.greaterThan(remaining)) {
            throw new Error("RECEIVE_QUANTITY_EXCEEDS_REMAINING");
          }

          const location = await tx.warehouseLocation.findFirst({
            where: {
              id: receivedItem.locationId,
              warehouseId: purchaseOrder.warehouseId,
              type: "BIN",
            },
          });

          if (!location) throw new Error("INVALID_WAREHOUSE_BIN");

          const batch = await tx.batchLot.upsert({
            where: {
              productId_batchNo: {
                productId: poItem.productId,
                batchNo: receivedItem.batchNo,
              },
            },
            create: {
              productId: poItem.productId,
              batchNo: receivedItem.batchNo,
              expiryDate: receivedItem.expiryDate,
              description: receivedItem.description,
            },
            update: {
              ...(receivedItem.expiryDate && {
                expiryDate: receivedItem.expiryDate,
              }),
              ...(receivedItem.description && {
                description: receivedItem.description,
              }),
            },
          });

          if (!batch.isActive) {
            throw new Error("BATCH_LOT_INACTIVE");
          }

          await tx.inventoryStock.upsert({
            where: {
              productId_locationId_batchLotId: {
                productId: poItem.productId,
                locationId: receivedItem.locationId,
                batchLotId: batch.id,
              },
            },
            create: {
              productId: poItem.productId,
              locationId: receivedItem.locationId,
              batchLotId: batch.id,
              quantity: receiveQuantity,
            },
            update: {
              quantity: { increment: receiveQuantity },
            },
          });

          await tx.stockMovement.create({
            data: {
              movementNo: `STK-${randomUUID()}`,
              type: "RECEIVE",
              productId: poItem.productId,
              batchLotId: batch.id,
              toLocationId: receivedItem.locationId,
              quantity: receiveQuantity,
              referenceNo: purchaseOrder.poNumber,
              note: `Received against PO ${purchaseOrder.poNumber}`,
              createdById,
            },
          });

          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: {
              receivedQuantity: { increment: receiveQuantity },
            },
          });
        }

        const updatedItems = await tx.purchaseOrderItem.findMany({
          where: { purchaseOrderId: id },
        });

        const allReceived = updatedItems.every((item) =>
          item.receivedQuantity.greaterThanOrEqualTo(item.quantity),
        );

        await tx.purchaseOrder.update({
          where: { id },
          data: {
            status: allReceived ? "RECEIVED" : "PARTIALLY_RECEIVED",
          },
        });

        return tx.purchaseOrder.findUnique({
          where: { id },
          include: purchaseOrderInclude,
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  },
};