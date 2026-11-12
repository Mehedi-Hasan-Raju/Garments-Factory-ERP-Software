import { z } from "zod";

export const createSewingSchema = z.object({
  sewingNumber: z.string().trim().min(1).max(50),
  productionOrderId: z.string().uuid(),
  sewingDate: z.coerce.date().optional(),
  sewingLine: z.string().trim().max(100).optional().nullable(),
  sewingQuantity: z.coerce.number().positive(),
  notes: z.string().trim().optional().nullable(),
});

export const updateSewingSchema = z
  .object({
    sewingNumber: z.string().trim().min(1).max(50).optional(),
    sewingDate: z.coerce.date().optional(),
    sewingLine: z.string().trim().max(100).optional().nullable(),
    sewingQuantity: z.coerce.number().positive().optional(),
    notes: z.string().trim().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const sewingIdSchema = z.object({
  id: z.string().uuid(),
});

export const sewingListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  productionOrderId: z.string().uuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export const productionOrderIdSchema = z.object({
  productionOrderId: z.string().uuid(),
});

export type CreateSewingInput = z.infer<typeof createSewingSchema>;
export type UpdateSewingInput = z.infer<typeof updateSewingSchema>;
export type SewingListQuery = z.infer<typeof sewingListQuerySchema>;