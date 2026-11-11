
import { AppError } from "../../lib/app-error.js";
import { departmentRepository } from "./department.repository.js";
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "./department.validation.js";

function handlePrismaError(error: unknown): never {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    throw new AppError(
      "A department with this name or code already exists",
      409,
    );
  }

  throw error;
}

export const departmentService = {
  async create(data: CreateDepartmentInput) {
    try {
      return await departmentRepository.create(data);
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

    const [departments, total] = await Promise.all([
      departmentRepository.findAll(query),
      departmentRepository.count(params),
    ]);

    return {
      departments,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  },

  async findById(id: string) {
    const department = await departmentRepository.findById(id);

    if (!department) {
      throw new AppError("Department not found", 404);
    }

    return department;
  },

  async update(id: string, data: UpdateDepartmentInput) {
    await this.findById(id);

    try {
      return await departmentRepository.update(id, data);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async updateStatus(id: string, isActive: boolean) {
    await this.findById(id);

    return departmentRepository.updateStatus(id, isActive);
  },

  async delete(id: string) {
    const department = await this.findById(id);

    if (department._count.employees > 0) {
      throw new AppError(
        "Cannot delete a department that has employees. Deactivate it instead.",
        409,
      );
    }

    return departmentRepository.delete(id);
  },
};
