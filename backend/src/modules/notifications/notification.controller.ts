
import type { Request, Response } from "express";
import { AppError } from "../../lib/app-error.js";

import { notificationService } from "./notification.service.js";

import {
  notificationIdParamSchema,
  notificationListQuerySchema,
} from "./notification.validation.js";

function requireAuthUserId(req: Request): string {
  if (!req.authUser) {
    throw new AppError("Authentication required", 401);
  }

  return req.authUser.id;
}

class NotificationController {
  // Get logged-in user's notifications
  async findAll(req: Request, res: Response) {
    const parsed = notificationListQuerySchema.safeParse(
      req.query
    );

    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ??
          "Invalid query parameters.",
        400
      );
    }

    const result = await notificationService.findAll(
      requireAuthUserId(req),
      parsed.data
    );

    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully.",
      data: result.notifications,
      pagination: result.pagination,
    });
  }

  // Get unread notification count
  async getUnreadCount(req: Request, res: Response) {
    const count = await notificationService.getUnreadCount(
      requireAuthUserId(req)
    );

    return res.status(200).json({
      success: true,
      message: "Unread notification count retrieved successfully.",
      data: {
        unreadCount: count,
      },
    });
  }

  // Get notification details
  async findById(req: Request, res: Response) {
    const parsed = notificationIdParamSchema.safeParse(
      req.params
    );

    if (!parsed.success) {
      throw new AppError(
        "Invalid notification ID.",
        400
      );
    }

    const notification =
      await notificationService.findById(
        parsed.data.id,
        requireAuthUserId(req)
      );

    return res.status(200).json({
      success: true,
      message: "Notification retrieved successfully.",
      data: notification,
    });
  }

  // Mark notification as read
  async markAsRead(req: Request, res: Response) {
    const parsed = notificationIdParamSchema.safeParse(
      req.params
    );

    if (!parsed.success) {
      throw new AppError(
        "Invalid notification ID.",
        400
      );
    }

    const notification =
      await notificationService.markAsRead(
        parsed.data.id,
        requireAuthUserId(req)
      );

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: notification,
    });
  }

  // Mark notification as unread
  async markAsUnread(req: Request, res: Response) {
    const parsed = notificationIdParamSchema.safeParse(
      req.params
    );

    if (!parsed.success) {
      throw new AppError(
        "Invalid notification ID.",
        400
      );
    }

    const notification =
      await notificationService.markAsUnread(
        parsed.data.id,
        requireAuthUserId(req)
      );

    return res.status(200).json({
      success: true,
      message: "Notification marked as unread.",
      data: notification,
    });
  }

  // Mark all notifications as read
  async markAllAsRead(req: Request, res: Response) {
    const result =
      await notificationService.markAllAsRead(
        requireAuthUserId(req)
      );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      data: {
        updatedCount: result.count,
      },
    });
  }

  // Delete own notification
  async delete(req: Request, res: Response) {
    const parsed = notificationIdParamSchema.safeParse(
      req.params
    );

    if (!parsed.success) {
      throw new AppError(
        "Invalid notification ID.",
        400
      );
    }

    await notificationService.delete(
      parsed.data.id,
      requireAuthUserId(req)
    );

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
    });
  }
}

export const notificationController =
  new NotificationController();
