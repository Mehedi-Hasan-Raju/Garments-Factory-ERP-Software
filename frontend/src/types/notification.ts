export type NotificationType =
  | "GENERAL"
  | "INVENTORY"
  | "PRODUCTION"
  | "PURCHASE"
  | "PAYMENT"
  | "SHIPMENT"
  | "HR"
  | "TASK";

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  isRead?: "true" | "false";
  type?: NotificationType;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationListResponse {
  success: boolean;
  message: string;
  data: Notification[];
  pagination: NotificationPagination;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data: Notification;
}

export interface UnreadCountResponse {
  success: boolean;
  message: string;
  data: {
    unreadCount: number;
  };
}

export interface MarkAllReadResponse {
  success: boolean;
  message: string;
  data: {
    updatedCount: number;
  };
}

export interface DeleteNotificationResponse {
  success: boolean;
  message: string;
}
