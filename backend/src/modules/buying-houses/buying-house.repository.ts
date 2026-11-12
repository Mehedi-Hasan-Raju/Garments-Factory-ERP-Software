import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";

export const buyingHouseRepository = {
  create(data: Prisma.BuyingHouseCreateInput) {
    return prisma.buyingHouse.create({
      data,
    });
  },

  findAll(
    where: Prisma.BuyingHouseWhereInput,
    skip: number,
    take: number
  ) {
    return prisma.buyingHouse.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            buyers: true,
          },
        },
      },
    });
  },

  count(where: Prisma.BuyingHouseWhereInput) {
    return prisma.buyingHouse.count({
      where,
    });
  },

  findById(id: string) {
    return prisma.buyingHouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            buyers: true,
          },
        },
      },
    });
  },

  findByCode(code: string) {
    return prisma.buyingHouse.findUnique({
      where: { code },
    });
  },

  update(id: string, data: Prisma.BuyingHouseUpdateInput) {
    return prisma.buyingHouse.update({
      where: { id },
      data,
    });
  },
};