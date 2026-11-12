
import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";

export const buyerRepository = {
  create(data: Prisma.BuyerUncheckedCreateInput) {
    return prisma.buyer.create({
      data,
      include: {
        buyingHouse: {
          select: {
            id: true,
            code: true,
            name: true,
            companyName: true,
          },
        },
      },
    });
  },

  findAll(
    where: Prisma.BuyerWhereInput,
    skip: number,
    take: number
  ) {
    return prisma.buyer.findMany({
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
      },
    });
  },

  count(where: Prisma.BuyerWhereInput) {
    return prisma.buyer.count({ where });
  },

  findById(id: string) {
    return prisma.buyer.findUnique({
      where: { id },
      include: {
        buyingHouse: {
          select: {
            id: true,
            code: true,
            name: true,
            companyName: true,
            country: true,
            isActive: true,
          },
        },
      },
    });
  },

  findByCode(buyerCode: string) {
    return prisma.buyer.findUnique({
      where: { buyerCode },
    });
  },

  update(
    id: string,
    data: Prisma.BuyerUncheckedUpdateInput
  ) {
    return prisma.buyer.update({
      where: { id },
      data,
      include: {
        buyingHouse: {
          select: {
            id: true,
            code: true,
            name: true,
            companyName: true,
          },
        },
      },
    });
  },
};
