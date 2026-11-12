import { z } from "zod";

const uuidSchema = z.string().uuid();

export const createCuttingSchema = z.object({
  cuttingNumber: z.string().trim().min(2).max(50),
  productionOrderId: uuidSchema,

  cuttingDate: z.coerce.date().optional(),

  cuttingQuantity: z.coerce.number().positive(),

  fabricConsumed: z.coerce.number().min(0).default(0),
  fabricConsumedUnit: z.string().trim().min(1).max(20).default("KG"),

  notes: z.string().trim().max(5000).nullable().optional(),
});

export const updateCuttingSchema = z.object({
  cuttingDate: z.coerce.date().optional(),
  cuttingQuantity: z.coerce.number().positive().optional(),
  fabricConsumed: z.coerce.number().min(0).optional(),
  fabricConsumedUnit: z.string().trim().min(1).max(20).optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" },
);

export const cuttingQuerySchema = z.object({
  productionOrderId: uuidSchema.optional(),
  search: z.string().trim().optional(),

  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).superRefine((data, ctx) => {
  if (data.fromDate && data.toDate && data.toDate < data.fromDate) {
    ctx.addIssue({
      code: "custom",
      path: ["toDate"],
      message: "toDate cannot be before fromDate",
    });
  }
});

export const cuttingIdSchema = z.object({
  id: uuidSchema,
});

export type CreateCuttingInput = z.infer<typeof createCuttingSchema>;
export type UpdateCuttingInput = z.infer<typeof updateCuttingSchema>;
export type CuttingQuery = z.infer<typeof cuttingQuerySchema>;
