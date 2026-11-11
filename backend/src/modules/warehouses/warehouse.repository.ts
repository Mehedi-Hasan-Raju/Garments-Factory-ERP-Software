
import { prisma } from "../../lib/prisma.js";

import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
} from "./warehouse.validation.js";

export const warehouseRepository = {
  create(data: CreateWarehouseInput) {
    return prisma.warehouse.create({
      data,
      include: {
        _count: {
          select: {
            locations: true,
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

    return prisma.warehouse.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            locations: true,
          },
        },
      },
    });
  },

  count(params: {
    search?: string;
    isActive?: boolean;
  }) {
    return prisma.warehouse.count({
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
    return prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            locations: true,
          },
        },
      },
    });
  },

  update(id: string, data: UpdateWarehouseInput) {
    return prisma.warehouse.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            locations: true,
          },
        },
      },
    });
  },

  updateStatus(id: string, isActive: boolean) {
    return prisma.warehouse.update({
      where: { id },
      data: { isActive },
      include: {
        _count: {
          select: {
            locations: true,
          },
        },
      },
    });
  },

  delete(id: string) {
    return prisma.warehouse.delete({
      where: { id },
    });
  },
};
