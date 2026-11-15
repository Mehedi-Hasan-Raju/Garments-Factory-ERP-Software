import { apiClient } from "@/lib/api-client";

import type {
  DeleteNotificationResponse,
  MarkAllReadResponse,
  NotificationListResponse,
  NotificationQueryParams,
  NotificationResponse,
  UnreadCountResponse,
} from "@/types/notification";

const BASE_URL = "/notifications";

export const notificationService = {
  // Get notifications with pagination and filters
  async getAll(params: NotificationQueryParams) {
    const response =
      await apiClient.get<NotificationListResponse>(
        BASE_URL,
        { params },
      );

    return response.data;
  },

  // Get unread notification count
  async getUnreadCount() {
    const response =
      await apiClient.get<UnreadCountResponse>(
        `${BASE_URL}/unread-count`,
      );

    return response.data;
  },

  // Get single notification
  async getById(id: string) {
    const response =
      await apiClient.get<NotificationResponse>(
        `${BASE_URL}/${id}`,
      );

    return response.data;
  },

  // Mark notification as read
  async markAsRead(id: string) {
    const response =
      await apiClient.patch<NotificationResponse>(
        `${BASE_URL}/${id}/read`,
      );

    return response.data;
  },

  // Mark notification as unread
  async markAsUnread(id: string) {
    const response =
      await apiClient.patch<NotificationResponse>(
        `${BASE_URL}/${id}/unread`,
      );

    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead() {
    const response =
      await apiClient.patch<MarkAllReadResponse>(
        `${BASE_URL}/mark-all-read`,
      );

    return response.data;
  },

  // Delete notification
  async delete(id: string) {
    const response =
      await apiClient.delete<DeleteNotificationResponse>(
        `${BASE_URL}/${id}`,
      );

    return response.data;
  },
};
