
import { AppError } from "../../lib/app-error.js";

import { warehouseLocationRepository } from "./warehouse-location.repository.js";

import type {
  CreateWarehouseLocationInput,
  UpdateWarehouseLocationInput,
} from "./warehouse-location.validation.js";

type LocationType = "RACK" | "SHELF" | "BIN";

function getExpectedParentType(type: LocationType): LocationType | null {
  if (type === "RACK") return null;
  if (type === "SHELF") return "RACK";
  return "SHELF";
}

function handlePrismaError(error: unknown): never {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    if (error.code === "P2002") {
      throw new AppError(
        "A location with this code already exists in this warehouse",
        409,
      );
    }

    if (error.code === "P2003" || error.code === "P2014") {
      throw new AppError(
        "Cannot perform this operation because related records exist",
        409,
      );
    }
  }

  throw error;
}

export const warehouseLocationService = {
  async validateLocationParent(
    warehouseId: string,
    type: LocationType,
    parentId?: string | null,
    currentId?: string,
  ) {
    const expectedParentType = getExpectedParentType(type);

    if (expectedParentType === null) {
      if (parentId) {
        throw new AppError(
          "A RACK cannot have a parent location",
          400,
        );
      }

      return;
    }

    if (!parentId) {
      throw new AppError(
        `${type} must have a ${expectedParentType} parent`,
        400,
      );
    }

    if (currentId && parentId === currentId) {
      throw new AppError(
        "A location cannot be its own parent",
        400,
      );
    }

    const parent = await warehouseLocationRepository.findParent(
      parentId,
    );

    if (!parent) {
      throw new AppError("Parent location not found", 404);
    }

    if (parent.warehouseId !== warehouseId) {
      throw new AppError(
        "Parent location must belong to the same warehouse",
        400,
      );
    }

    if (parent.type !== expectedParentType) {
      throw new AppError(
        `${type} must be placed under a ${expectedParentType}`,
        400,
      );
    }
  },

  async create(data: CreateWarehouseLocationInput) {
    const warehouse =
      await warehouseLocationRepository.findWarehouseById(
        data.warehouseId,
      );

    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    if (!warehouse.isActive) {
      throw new AppError(
        "Cannot add locations to an inactive warehouse",
        409,
      );
    }

    await this.validateLocationParent(
      data.warehouseId,
      data.type,
      data.parentId,
    );

    try {
      return await warehouseLocationRepository.create(data);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    warehouseId?: string;
    type?: LocationType;
  }) {
    if (params.warehouseId) {
      const warehouse =
        await warehouseLocationRepository.findWarehouseById(
          params.warehouseId,
        );

      if (!warehouse) {
        throw new AppError("Warehouse not found", 404);
      }
    }

    const skip = (params.page - 1) * params.limit;

    const query = {
      skip,
      take: params.limit,
      search: params.search,
      warehouseId: params.warehouseId,
      type: params.type,
    };

    const [locations, total] = await Promise.all([
      warehouseLocationRepository.findAll(query),
      warehouseLocationRepository.count(params),
    ]);

    return {
      locations,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  },

  async findById(id: string) {
    const location = await warehouseLocationRepository.findById(id);

    if (!location) {
      throw new AppError("Warehouse location not found", 404);
    }

    return location;
  },

  async update(id: string, data: UpdateWarehouseLocationInput) {
    const current = await this.findById(id);

    const nextType = data.type ?? current.type;
    const nextParentId =
      data.parentId !== undefined
        ? data.parentId
        : current.parentId;

    if (
      data.type &&
      data.type !== current.type &&
      current._count.children > 0
    ) {
      throw new AppError(
        "Cannot change location type while child locations exist",
        409,
      );
    }

    await this.validateLocationParent(
      current.warehouseId,
      nextType,
      nextParentId,
      current.id,
    );

    try {
      return await warehouseLocationRepository.update(id, data);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async delete(id: string) {
    const location = await this.findById(id);

    if (location._count.children > 0) {
      throw new AppError(
        "Cannot delete a location that has child locations",
        409,
      );
    }

    try {
      return await warehouseLocationRepository.delete(id);
    } catch (error) {
      handlePrismaError(error);
    }
  },
};
