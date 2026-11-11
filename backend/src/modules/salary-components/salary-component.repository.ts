
import { prisma } from "../../lib/prisma.js";
import type {
  CreateSalaryComponentInput,
  UpdateSalaryComponentInput,
} from "./salary-component.validation.js";

export const salaryComponentRepository = {
  create(data: CreateSalaryComponentInput) {
    return prisma.salaryComponent.create({ data });
  },

  findAll() {
    return prisma.salaryComponent.findMany({
      orderBy: { name: "asc" },
    });
  },

  findById(id: string) {
    return prisma.salaryComponent.findUnique({
      where: { id },
    });
  },

  findByCode(code: string) {
    return prisma.salaryComponent.findUnique({
      where: { code },
    });
  },

  update(id: string, data: UpdateSalaryComponentInput) {
    return prisma.salaryComponent.update({
      where: { id },
      data,
    });
  },
};
