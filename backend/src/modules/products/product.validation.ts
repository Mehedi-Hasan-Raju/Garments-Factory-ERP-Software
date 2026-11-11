import { z } from "zod";

const skuSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .transform((value) => value.toUpperCase())
  .refine(
    (value) => /^[A-Z0-9_-]+$/.test(value),
    "SKU must contain uppercase letters, numbers, _ or -",
  );

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(150),
  sku: skuSchema,
  description: z.string().trim().max(2000).nullable().optional(),
  categoryId: z.string().uuid(),
  unitId: z.string().uuid(),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    sku: skuSchema.optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    categoryId: z.string().uuid().optional(),
    unitId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const productIdSchema = z.object({
  id: z.string().uuid(),
});

export const productListQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  categoryId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  isActive: z.enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["name", "sku", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
