import { prisma } from "../../lib/prisma.js";
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "./department.validation.js";

export const departmentRepository = {
  create(data: CreateDepartmentInput) {
    return prisma.department.create({
      data,
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });
  },

  findAll(params: {
    skip: number;
    take: number;
    search?: string;
    isActive?: boolean;
  }) {
    const where = {
      ...(params.isActive !== undefined && {
        isActive: params.isActive,
      }),

      ...(params.search && {
        OR: [
          {
            name: {
              contains: params.search,
              mode: "insensitive" as const,
            },
          },
          {
            code: {
              contains: params.search,
              mode: "insensitive" as const,
            },
          },
        ],
      }),
    };

    return prisma.department.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });
  },

  count(params: {
    search?: string;
    isActive?: boolean;
  }) {
    return prisma.department.count({
      where: {
        ...(params.isActive !== undefined && {
          isActive: params.isActive,
        }),

        ...(params.search && {
          OR: [
            {
              name: {
                contains: params.search,
                mode: "insensitive",
              },
            },
            {
              code: {
                contains: params.search,
                mode: "insensitive",
              },
            },
          ],
        }),
      },
    });
  },

  findById(id: string) {
    return prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });
  },

  update(id: string, data: UpdateDepartmentInput) {
    return prisma.department.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });
  },

  updateStatus(id: string, isActive: boolean) {
    return prisma.department.update({
      where: { id },
      data: { isActive },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });
  },

  delete(id: string) {
    return prisma.department.delete({
      where: { id },
    });
  },
};
