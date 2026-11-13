
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";

import type {
  NotificationListQuery,
} from "./notification.validation.js";

class NotificationRepository {
  async findAll(
    recipientId: string,
    query: NotificationListQuery
  ) {
    const { page, limit, isRead, type } = query;

    const where: Prisma.NotificationWhereInput = {
      recipientId,

      ...(isRead !== undefined && {
        isRead: isRead === "true",
      }),

      ...(type && { type }),
    };

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),

      prisma.notification.count({
        where,
      }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(
    id: string,
    recipientId: string
  ) {
    return prisma.notification.findFirst({
      where: {
        id,
        recipientId,
      },
    });
  }

  async getUnreadCount(recipientId: string) {
    return prisma.notification.count({
      where: {
        recipientId,
        isRead: false,
      },
    });
  }

  async markAsRead(
    id: string,
    recipientId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const notification =
        await tx.notification.findFirst({
          where: {
            id,
            recipientId,
          },
        });

      if (!notification) {
        throw new AppError(
          "Notification not found.",
          404
        );
      }

      return tx.notification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: notification.readAt ?? new Date(),
        },
      });
    });
  }

  async markAsUnread(
    id: string,
    recipientId: string
  ) {
    const notification =
      await prisma.notification.findFirst({
        where: {
          id,
          recipientId,
        },
      });

    if (!notification) {
      throw new AppError(
        "Notification not found.",
        404
      );
    }

    return prisma.notification.update({
      where: { id },
      data: {
        isRead: false,
        readAt: null,
      },
    });
  }

  async markAllAsRead(recipientId: string) {
    return prisma.notification.updateMany({
      where: {
        recipientId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async delete(
    id: string,
    recipientId: string
  ) {
    const notification =
      await prisma.notification.findFirst({
        where: {
          id,
          recipientId,
        },
      });

    if (!notification) {
      throw new AppError(
        "Notification not found.",
        404
      );
    }

    return prisma.notification.delete({
      where: { id },
    });
  }
}

export const notificationRepository =
  new NotificationRepository();
