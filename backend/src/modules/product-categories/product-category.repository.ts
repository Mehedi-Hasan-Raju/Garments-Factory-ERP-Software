
import { prisma } from "../../lib/prisma.js";

export const productCategoryRepository = {
  create(data: {
    name: string;
    code: string;
    description?: string | null;
  }) {
    return prisma.productCategory.create({ data });
  },

  findAll() {
    return prisma.productCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } },
      },
    });
  },

  findById(id: string) {
    return prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });
  },

  findByCode(code: string) {
    return prisma.productCategory.findUnique({ where: { code } });
  },

  update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
    },
  ) {
    return prisma.productCategory.update({
      where: { id },
      data,
    });
  },

  async hasProducts(id: string) {
    const count = await prisma.product.count({
      where: { categoryId: id },
    });
    return count > 0;
  },
};
