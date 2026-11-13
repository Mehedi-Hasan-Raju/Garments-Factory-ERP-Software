import { prisma } from "./prisma.js";

export type NotificationRole =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "EMPLOYEE"
  | "ACCOUNTANT"
  | "STOREKEEPER";

export type AutomaticNotificationInput = {
  title: string;
  message: string;
  type:
    | "GENERAL"
    | "INVENTORY"
    | "PRODUCTION"
    | "PURCHASE"
    | "PAYMENT"
    | "SHIPMENT"
    | "HR"
    | "TASK";
  actionUrl?: string;
  deduplicateUnread?: boolean;
};

/**
 * Creates in-app notifications for active users assigned to the supplied roles.
 * Notification failures are logged but never roll back the business operation.
 */

export async function notifyRoles(
  roles: NotificationRole[],
  notification: AutomaticNotificationInput,
  excludeUserId?: string,
): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: { isActive: true, code: { in: roles } },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });

    const recipientIds = users.map((user) => user.id);
    if (recipientIds.length === 0) return;

    let recipients = recipientIds;
    if (notification.deduplicateUnread && notification.actionUrl) {
      const existing = await prisma.notification.findMany({
        where: {
          recipientId: { in: recipientIds },
          title: notification.title,
          actionUrl: notification.actionUrl,
          isRead: false,
        },
        select: { recipientId: true },
      });
      const alreadyNotified = new Set(existing.map((item) => item.recipientId));
      recipients = recipientIds.filter((id) => !alreadyNotified.has(id));
    }

    if (recipients.length === 0) return;

    await prisma.notification.createMany({
      data: recipients.map((recipientId) => ({
        recipientId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        actionUrl: notification.actionUrl,
      })),
    });
  } catch (error) {
    console.error("[automatic-notification] Failed to create notification:", error);
  }
}

export async function notifyUsers(
  recipientIds: string[],
  notification: AutomaticNotificationInput,
): Promise<void> {
  try {
    const uniqueIds = [...new Set(recipientIds)];
    if (uniqueIds.length === 0) return;

    await prisma.notification.createMany({
      data: uniqueIds.map((recipientId) => ({
        recipientId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        actionUrl: notification.actionUrl,
      })),
    });
  } catch (error) {
    console.error("[automatic-notification] Failed to create user notification:", error);
  }
}
