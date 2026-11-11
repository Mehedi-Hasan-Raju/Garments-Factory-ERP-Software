import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { productRepository } from "./product.repository.js";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductListQuery,
} from "./product.validation.js";

export const productService = {
  async validateRelations(categoryId: string, unitId: string) {
    const [category, unit] = await Promise.all([
      prisma.productCategory.findUnique({
        where: { id: categoryId },
        select: { id: true, isActive: true },
      }),
      prisma.unitOfMeasure.findUnique({
        where: { id: unitId },
        select: { id: true, isActive: true },
      }),
    ]);

    if (!category) {
      throw new AppError("Product category not found", 404);
    }

    if (!category.isActive) {
      throw new AppError("Selected product category is inactive", 400);
    }

    if (!unit) {
      throw new AppError("Unit of measure not found", 404);
    }

    if (!unit.isActive) {
      throw new AppError("Selected unit is inactive", 400);
    }
  },

  async create(data: CreateProductInput) {
    await this.validateRelations(data.categoryId, data.unitId);

    try {
      return await productRepository.create(data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError("Product SKU already exists", 409);
      }

      throw error;
    }
  },

  async findAll(query: ProductListQuery) {
    const { products, total } = await productRepository.findAll(query);

    return {
      products,
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

  async findById(id: string) {
    const product = await productRepository.findById(id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  },

  async update(id: string, data: UpdateProductInput) {
    await this.findById(id);

    if (data.categoryId || data.unitId || data.isActive === true) {
      const current = await productRepository.findById(id);

      if (!current) {
        throw new AppError("Product not found", 404);
      }

      await this.validateRelations(
        data.categoryId ?? current.categoryId,
        data.unitId ?? current.unitId,
      );
    }

    try {
      return await productRepository.update(id, data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError("Product SKU already exists", 409);
      }

      throw error;
    }
  },

  async delete(id: string) {
  await this.findById(id);

  return productRepository.update(id, { isActive: false });
},
};
