import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/app-error.js";
import { unitRepository } from "./unit.repository.js";
import type {
  CreateUnitInput,
  UpdateUnitInput,
} from "./unit.validation.js";

export const unitService = {
  async create(data: CreateUnitInput) {
    try {
      return await unitRepository.create(data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError("Unit name or code already exists", 409);
      }

      throw error;
    }
  },

  async findAll() {
    return unitRepository.findAll();
  },

  async findById(id: string) {
    const unit = await unitRepository.findById(id);

    if (!unit) {
      throw new AppError("Unit not found", 404);
    }

    return unit;
  },

  async update(id: string, data: UpdateUnitInput) {
    await this.findById(id);

    if (
      data.isActive === false &&
      (await unitRepository.hasProducts(id))
    ) {
      throw new AppError(
        "Cannot deactivate a unit that is currently assigned to products",
        409,
      );
    }

    try {
      return await unitRepository.update(id, data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError("Unit name already exists", 409);
      }

      throw error;
    }
  },

  async delete(id: string) {
    await this.findById(id);

    if (await unitRepository.hasProducts(id)) {
      throw new AppError(
        "Cannot deactivate a unit that is currently assigned to products",
        409,
      );
    }

    // Soft delete: preserve historical records.
    return unitRepository.update(id, { isActive: false });
  },
};
