import { z } from "zod";

export const auditLogIdSchema = z.object({ id: z.string().uuid() });

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  module: z.string().trim().min(1).max(100).optional(),
  action: z.enum(["CREATE", "UPDATE", "DELETE"]).optional(),
  actorId: z.string().uuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
