import { AppError } from "../../lib/app-error.js";

import { notificationRepository } from "./notification.repository.js";

import type {
  NotificationListQuery,
} from "./notification.validation.js";

class NotificationService {
  async findAll(
    recipientId: string,
    query: NotificationListQuery
  ) {
    return notificationRepository.findAll(
      recipientId,
      query
    );
  }

  async findById(
    id: string,
    recipientId: string
  ) {
    const notification =
      await notificationRepository.findById(
        id,
        recipientId
      );

    if (!notification) {
      throw new AppError(
        "Notification not found.",
        404
      );
    }

    return notification;
  }

  async getUnreadCount(recipientId: string) {
    return notificationRepository.getUnreadCount(
      recipientId
    );
  }

  async markAsRead(
    id: string,
    recipientId: string
  ) {
    return notificationRepository.markAsRead(
      id,
      recipientId
    );
  }

  async markAsUnread(
    id: string,
    recipientId: string
  ) {
    return notificationRepository.markAsUnread(
      id,
      recipientId
    );
  }

  async markAllAsRead(recipientId: string) {
    return notificationRepository.markAllAsRead(
      recipientId
    );
  }

  async delete(
    id: string,
    recipientId: string
  ) {
    return notificationRepository.delete(
      id,
      recipientId
    );
  }
}

export const notificationService =
  new NotificationService();
