
import { prisma } from "../../lib/prisma.js";

import type {
  CreateWarehouseLocationInput,
  UpdateWarehouseLocationInput,
} from "./warehouse-location.validation.js";

export const warehouseLocationRepository = {
  create(data: CreateWarehouseLocationInput) {
    return prisma.warehouseLocation.create({
      data: {
        name: data.name,
        code: data.code,
        type: data.type,
        warehouseId: data.warehouseId,
        parentId: data.parentId ?? null,
      },
      include: {
        parent: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
    });
  },

  findAll(params: {
    skip: number;
    take: number;
    search?: string;
    warehouseId?: string;
    type?: "RACK" | "SHELF" | "BIN";
  }) {
    const where = {
      ...(params.warehouseId && {
        warehouseId: params.warehouseId,
      }),

      ...(params.type && {
        type: params.type,
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

    return prisma.warehouseLocation.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: [
        { warehouseId: "asc" },
        { type: "asc" },
        { code: "asc" },
      ],
      include: {
        parent: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
    });
  },

  count(params: {
    search?: string;
    warehouseId?: string;
    type?: "RACK" | "SHELF" | "BIN";
  }) {
    return prisma.warehouseLocation.count({
      where: {
        ...(params.warehouseId && {
          warehouseId: params.warehouseId,
        }),

        ...(params.type && {
          type: params.type,
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
      },
    });
  },

  findById(id: string) {
    return prisma.warehouseLocation.findUnique({
      where: { id },
      include: {
        warehouse: true,
        parent: true,
        children: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
    });
  },

  findWarehouseById(id: string) {
    return prisma.warehouse.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });
  },

  findParent(id: string) {
    return prisma.warehouseLocation.findUnique({
      where: { id },
      select: {
        id: true,
        warehouseId: true,
        type: true,
      },
    });
  },

  update(id: string, data: UpdateWarehouseLocationInput) {
    return prisma.warehouseLocation.update({
      where: { id },
      data,
      include: {
        parent: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
    });
  },

  delete(id: string) {
    return prisma.warehouseLocation.delete({
      where: { id },
    });
  },
};
