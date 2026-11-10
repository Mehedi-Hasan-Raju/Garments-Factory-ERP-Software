
import { prisma } from "../../lib/prisma.js";

export const userRepository = {
  // Find creator with current role and permissions
  findCreatorById(userId: string) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: {
                  select: {
                    code: true,
                  },
                },
              },
            },
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
};
