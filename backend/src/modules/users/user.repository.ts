import { prisma } from "../../lib/prisma.js";

import type { UserQueryInput } from "./user.validation.js";

export const userRepository = {
  // Find creator with current role
  findCreatorById(userId: string) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
          },
        },
      },
    });
  },

  // Find role by unique role code
  findRoleByCode(code: string) {
    return prisma.role.findUnique({
      where: {
        code,
      },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
      },
    });
  },

  // Check whether email already exists
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });
  },

  // Create user and return safe fields only
  createUser(data: {
    email: string;
    passwordHash: string;
    roleId: string;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        roleId: data.roleId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        status: true,
        role: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
      },
    });
  },

  // Get users with search, filters and pagination
  findAll(params: UserQueryInput) {
    const where = {
      ...(params.search && {
        email: {
          contains: params.search,
          mode: "insensitive" as const,
        },
      }),

      ...(params.roleCode && {
        role: {
          code: params.roleCode,
        },
      }),

      ...(params.status && {
        status: params.status,
      }),
    };

    return prisma.user.findMany({
      where,

      skip: (params.page - 1) * params.limit,
      take: params.limit,

      orderBy: {
        [params.sortBy]: params.sortOrder,
      },

      select: {
        id: true,
        email: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,

        role: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  },

  // Count users matching the same filters
  count(params: UserQueryInput) {
    return prisma.user.count({
      where: {
        ...(params.search && {
          email: {
            contains: params.search,
            mode: "insensitive" as const,
          },
        }),

        ...(params.roleCode && {
          role: {
            code: params.roleCode,
          },
        }),

        ...(params.status && {
          status: params.status,
        }),
      },
    });
  },
};