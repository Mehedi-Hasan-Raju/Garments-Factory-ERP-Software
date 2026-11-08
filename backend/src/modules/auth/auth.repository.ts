
import { prisma } from "../../lib/prisma.js";

const userAuthInclude = {
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
} as const;

export const authRepository = {
  // Find user by email with role and permissions
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: userAuthInclude,
    });
  },

  // Find user by ID with role and permissions
  findUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: userAuthInclude,
    });
  },

  // Create a new refresh-token session
  createSession(data: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.userSession.create({
      data: {
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  },

  // Find session by refresh-token hash
  findSessionByRefreshToken(refreshTokenHash: string) {
    return prisma.userSession.findUnique({
      where: { refreshTokenHash },
      include: {
        user: {
          include: userAuthInclude,
        },
      },
    });
  },

  // Find session by session ID
findSessionById(sessionId: string) {
  return prisma.userSession.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        include: userAuthInclude,
      },
    },
  });
},


  // Revoke a specific session
  revokeSession(sessionId: string) {
    return prisma.userSession.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  // Revoke all active sessions of a user
  revokeAllUserSessions(userId: string) {
    return prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },
};
