
import { AppError } from "../../lib/app-error.js";

import { warehouseRepository } from "./warehouse.repository.js";

import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
} from "./warehouse.validation.js";

function handlePrismaError(error: unknown): never {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    throw new AppError(
      "A warehouse with this code already exists",
      409,
    );
  }

  throw error;
}

export const warehouseService = {
  async create(data: CreateWarehouseInput) {
    try {
      return await warehouseRepository.create(data);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }) {
    const skip = (params.page - 1) * params.limit;

    const query = {
      skip,
      take: params.limit,
      search: params.search,
      isActive: params.isActive,
    };

    const [warehouses, total] = await Promise.all([
      warehouseRepository.findAll(query),
      warehouseRepository.count(params),
    ]);

    return {
      warehouses,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  },

  async findById(id: string) {
    const warehouse = await warehouseRepository.findById(id);

    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    return warehouse;
  },

  async update(id: string, data: UpdateWarehouseInput) {
    await this.findById(id);

    try {
      return await warehouseRepository.update(id, data);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async updateStatus(id: string, isActive: boolean) {
    await this.findById(id);

    return warehouseRepository.updateStatus(id, isActive);
  },

  async delete(id: string) {
    const warehouse = await this.findById(id);

    if (warehouse._count.locations > 0) {
      throw new AppError(
        "Cannot delete a warehouse that has locations. Remove its locations first.",
        409,
      );
    }

    return warehouseRepository.delete(id);
  },
};
