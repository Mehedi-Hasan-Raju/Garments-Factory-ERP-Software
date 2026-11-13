import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js";

import { notificationController } from "./notification.controller.js";

const router = Router();


router.use(authenticate);


router.get(
  "/unread-count",
  notificationController.getUnreadCount
);

// Mark all notifications as read
router.patch(
  "/mark-all-read",
  notificationController.markAllAsRead
);

// Get notification list
router.get(
  "/",
  notificationController.findAll
);

// Mark notification as read
router.patch(
  "/:id/read",
  notificationController.markAsRead
);

// Mark notification as unread
router.patch(
  "/:id/unread",
  notificationController.markAsUnread
);

// Delete notification
router.delete(
  "/:id",
  notificationController.delete
);

// Get notification details
router.get(
  "/:id",
  notificationController.findById
);

export default router;
