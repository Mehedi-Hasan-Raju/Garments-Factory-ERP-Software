
import { AppError } from "../../lib/app-error.js";
import { salaryComponentRepository } from "./salary-component.repository.js";
import type {
  CreateSalaryComponentInput,
  UpdateSalaryComponentInput,
} from "./salary-component.validation.js";

const isPrismaError = (error: unknown, code: string) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === code;

export const salaryComponentService = {
  async create(data: CreateSalaryComponentInput) {
    try {
      return await salaryComponentRepository.create(data);
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        throw new AppError("Salary component code already exists", 409);
      }
      throw error;
    }
  },

  async findAll() {
    return salaryComponentRepository.findAll();
  },

  async findById(id: string) {
    const component = await salaryComponentRepository.findById(id);

    if (!component) {
      throw new AppError("Salary component not found", 404);
    }

    return component;
  },

  async update(id: string, data: UpdateSalaryComponentInput) {
    await this.findById(id);

    return salaryComponentRepository.update(id, data);
  },
};
