import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";

export const productionOrderRepository = {
  create(data: Prisma.ProductionOrderUncheckedCreateInput) {
    return prisma.productionOrder.create({
      data,
      include: {
        buyingHouse: true,
        buyer: true,
        product: true,
      },
    });
  },

  findMany(
    where: Prisma.ProductionOrderWhereInput,
    skip: number,
    take: number,
  ) {
    return prisma.productionOrder.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        buyingHouse: {
          select: {
            id: true,
            code: true,
            name: true,
            companyName: true,
          },
        },
        buyer: {
          select: {
            id: true,
            buyerCode: true,
            name: true,
            companyName: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });
  },

  count(where: Prisma.ProductionOrderWhereInput) {
    return prisma.productionOrder.count({ where });
  },

  findById(id: string) {
    return prisma.productionOrder.findUnique({
      where: { id },
      include: {
        buyingHouse: true,
        buyer: true,
        product: true,
      },
    });
  },

  findByOrderNumber(orderNumber: string) {
    return prisma.productionOrder.findUnique({
      where: { orderNumber },
    });
  },

  update(
    id: string,
    data: Prisma.ProductionOrderUncheckedUpdateInput,
  ) {
    return prisma.productionOrder.update({
      where: { id },
      data,
      include: {
        buyingHouse: true,
        buyer: true,
        product: true,
      },
    });
  },

  findBuyingHouse(id: string) {
    return prisma.buyingHouse.findUnique({
      where: { id },
      select: {
        id: true,
        isActive: true,
      },
    });
  },

  findBuyer(id: string) {
    return prisma.buyer.findUnique({
      where: { id },
      select: {
        id: true,
        buyingHouseId: true,
        isActive: true,
      },
    });
  },

  findProduct(id: string) {
    return prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        isActive: true,
      },
    });
  },
};