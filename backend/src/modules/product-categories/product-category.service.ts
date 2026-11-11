
import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/app-error.js";
import { productCategoryRepository } from "./product-category.repository.js";
import type {
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
} from "./product-category.validation.js";

export const productCategoryService = {
  async create(data: CreateProductCategoryInput) {
    try {
      return await productCategoryRepository.create(data);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Category name or code already exists", 409);
      }
      throw error;
    }
  },

  async findAll() {
    return productCategoryRepository.findAll();
  },

  async findById(id: string) {
    const category = await productCategoryRepository.findById(id);

    if (!category) {
      throw new AppError("Product category not found", 404);
    }

    return category;
  },

  async update(id: string, data: UpdateProductCategoryInput) {
    await this.findById(id);

    try {
      return await productCategoryRepository.update(id, data);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Category name already exists", 409);
      }
      throw error;
    }
  },

  async delete(id: string) {
    await this.findById(id);

    if (await productCategoryRepository.hasProducts(id)) {
      throw new AppError("Cannot delete a category that has products", 409);
    }

    // Soft delete: retain historical records.
    return productCategoryRepository.update(id, { isActive: false });
  },
};
