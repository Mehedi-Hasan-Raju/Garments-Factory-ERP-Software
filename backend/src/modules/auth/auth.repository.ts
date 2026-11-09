
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

  // Create login session and update last login atomically
  createLoginSession(data: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      await tx.user.update({
        where: {
          id: data.userId,
        },
        data: {
          lastLoginAt: now,
        },
      });

      return tx.userSession.create({
        data: {
          userId: data.userId,
          refreshTokenHash: data.refreshTokenHash,
          expiresAt: data.expiresAt,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
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

  // Atomically rotate an existing refresh-token session
  rotateSession(data: {
    sessionId: string;
    currentRefreshTokenHash: string;
    newRefreshTokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const oldSession = await tx.userSession.findUnique({
        where: { id: data.sessionId },
        select: {
          userId: true,
          ipAddress: true,
          userAgent: true,
        },
      });

      if (!oldSession) {
        return null;
      }

      const now = new Date();

      const revoked = await tx.userSession.updateMany({
        where: {
          id: data.sessionId,
          refreshTokenHash: data.currentRefreshTokenHash,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          revokedAt: now,
        },
      });

      if (revoked.count !== 1) {
        return null;
      }

      return tx.userSession.create({
        data: {
          userId: oldSession.userId,
          refreshTokenHash: data.newRefreshTokenHash,
          expiresAt: data.expiresAt,
          ipAddress: oldSession.ipAddress,
          userAgent: oldSession.userAgent,
        },
      });
    });
  },
};
