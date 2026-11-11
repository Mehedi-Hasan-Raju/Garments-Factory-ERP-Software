
import { z } from "zod";

// Create warehouse
export const createWarehouseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Warehouse name must be at least 2 characters")
    .max(100, "Warehouse name cannot exceed 100 characters"),

  code: z
    .string()
    .trim()
    .min(2, "Warehouse code must be at least 2 characters")
    .max(30, "Warehouse code cannot exceed 30 characters")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Warehouse code can only contain letters, numbers, hyphens and underscores",
    ),

  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional()
    .nullable(),
});

// Update warehouse
export const updateWarehouseSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    code: z
      .string()
      .trim()
      .min(2)
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),

    description: z
      .string()
      .trim()
      .max(5000)
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// Update warehouse status
export const updateWarehouseStatusSchema = z.object({
  isActive: z.boolean({
    error: "isActive must be a boolean",
  }),
});

// Warehouse ID params
export const warehouseIdSchema = z.string().uuid("Invalid warehouse ID");

// Warehouse list query
export const warehouseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  search: z
    .string()
    .trim()
    .max(100)
    .optional(),

  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

// Inferred types
export type CreateWarehouseInput = z.infer<
  typeof createWarehouseSchema
>;

export type UpdateWarehouseInput = z.infer<
  typeof updateWarehouseSchema
>;

export type UpdateWarehouseStatusInput = z.infer<
  typeof updateWarehouseStatusSchema
>;

export type WarehouseQueryInput = z.infer<
  typeof warehouseQuerySchema
>;
