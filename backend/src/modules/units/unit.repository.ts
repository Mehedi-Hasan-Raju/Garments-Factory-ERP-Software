
import { prisma } from "../../lib/prisma.js";

export const unitRepository = {
  create(data: {
    name: string;
    code: string;
    description?: string | null;
  }) {
    return prisma.unitOfMeasure.create({ data });
  },

  findAll() {
    return prisma.unitOfMeasure.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  },

  findById(id: string) {
    return prisma.unitOfMeasure.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  },

  update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
    },
  ) {
    return prisma.unitOfMeasure.update({
      where: { id },
      data,
    });
  },

  async hasProducts(id: string) {
    const count = await prisma.product.count({
      where: { unitId: id },
    });

    return count > 0;
  },
};
