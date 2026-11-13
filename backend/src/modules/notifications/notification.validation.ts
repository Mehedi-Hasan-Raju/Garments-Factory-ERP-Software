import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "GENERAL",
  "INVENTORY",
  "PRODUCTION",
  "PURCHASE",
  "PAYMENT",
  "SHIPMENT",
  "HR",
  "TASK",
]);

export const notificationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  isRead: z.enum(["true", "false"]).optional(),

  type: notificationTypeSchema.optional(),
});

export type NotificationListQuery = z.infer<
  typeof notificationListQuerySchema
>;
