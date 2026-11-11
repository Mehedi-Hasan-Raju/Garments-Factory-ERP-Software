
import { z } from "zod";

const locationTypeSchema = z.enum(["RACK", "SHELF", "BIN"]);

export const createWarehouseLocationSchema = z.object({
  name: z.string().trim().min(2).max(100),

  code: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/),

  type: locationTypeSchema,

  warehouseId: z.string().uuid(),

  parentId: z.string().uuid().nullable().optional(),
});

export const updateWarehouseLocationSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),

    code: z
      .string()
      .trim()
      .min(2)
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),

    type: locationTypeSchema.optional(),

    parentId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const warehouseLocationIdSchema = z.string().uuid();

export const warehouseLocationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  search: z.string().trim().max(100).optional(),

  warehouseId: z.string().uuid().optional(),

  type: locationTypeSchema.optional(),
});

export type CreateWarehouseLocationInput = z.infer<
  typeof createWarehouseLocationSchema
>;

export type UpdateWarehouseLocationInput = z.infer<
  typeof updateWarehouseLocationSchema
>;

export type WarehouseLocationQueryInput = z.infer<
  typeof warehouseLocationQuerySchema
>;
