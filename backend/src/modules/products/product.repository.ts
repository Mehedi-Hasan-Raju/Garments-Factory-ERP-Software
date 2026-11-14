
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductListQuery,
} from "./product.validation.js";

export const productRepository = {
  create(data: CreateProductInput) {
    return prisma.product.create({
      data,
      include: {
        category: true,
        unit: true,
      },
    });
  },

  async findAll(query: ProductListQuery) {
    const {
      search,
      categoryId,
      unitId,
      isActive,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.ProductWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(unitId ? { unitId } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          unit: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
    };
  },

  findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        unit: true,
      },
    });
  },

  findBySku(sku: string) {
    return prisma.product.findUnique({
      where: { sku },
    });
  },

  update(id: string, data: UpdateProductInput) {
    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        unit: true,
      },
    });
  },

  async hasInventory(id: string) {
    // Inventory relation will be added when the inventory module is implemented.
    // Product deactivation is currently allowed.
    return false;
  },

  getUsageCounts(id: string, tx: Prisma.TransactionClient) {
    return tx.product.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            batchLots: true,
            inventoryStocks: true,
            stockMovements: true,
            purchaseOrderItems: true,
            productionOrders: true,
          },
        },
      },
    });
  },

  permanentDelete(id: string, tx: Prisma.TransactionClient) {
    return tx.product.delete({
      where: { id },
    });
  },
};
