import { z } from "zod";

export const createFinishedGoodsSchema = z.object({
  finishedGoodsNumber: z.string().trim().min(1).max(50),
  qcInspectionId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  warehouseLocationId: z.string().uuid().optional().nullable(),
  receivedDate: z.coerce.date().optional(),
  notes: z.string().trim().optional().nullable(),
});

export const finishedGoodsListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  productionOrderId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
});

export const finishedGoodsIdSchema = z.object({
  id: z.string().uuid(),
});

export const stockMovementSchema = z.object({
  movementType: z.enum(["RESERVATION", "RELEASE", "SHIPMENT"]),
  quantity: z.coerce.number().positive(),
  referenceNumber: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export type CreateFinishedGoodsInput = z.infer<
  typeof createFinishedGoodsSchema
>;

export type FinishedGoodsListQuery = z.infer<
  typeof finishedGoodsListQuerySchema
>;

export type StockMovementInput = z.infer<typeof stockMovementSchema>;