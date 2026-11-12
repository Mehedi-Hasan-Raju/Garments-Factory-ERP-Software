import { z } from "zod";

const defectSchema = z.object({
  defectType: z.string().trim().min(1).max(100),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL"]).default("MINOR"),
  defectQuantity: z.coerce.number().positive(),
  notes: z.string().trim().optional().nullable(),
});

export const createQCInspectionSchema = z.object({
  qcNumber: z.string().trim().min(1).max(50),
  productionOrderId: z.string().uuid(),
  inspectionDate: z.coerce.date().optional(),
  inspectedQuantity: z.coerce.number().positive(),
  passedQuantity: z.coerce.number().min(0),
  rejectedQuantity: z.coerce.number().min(0),
  reworkQuantity: z.coerce.number().min(0),
  notes: z.string().trim().optional().nullable(),
  defects: z.array(defectSchema).default([]),
});

export const qcListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  productionOrderId: z.string().uuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export const qcIdSchema = z.object({
  id: z.string().uuid(),
});

export const productionOrderIdSchema = z.object({
  productionOrderId: z.string().uuid(),
});

export type CreateQCInspectionInput = z.infer<
  typeof createQCInspectionSchema
>;

export type QCListQuery = z.infer<typeof qcListQuerySchema>;