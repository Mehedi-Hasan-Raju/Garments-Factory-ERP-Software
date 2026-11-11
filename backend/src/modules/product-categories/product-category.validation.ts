
import { z } from "zod";

export const createProductCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(2).max(30)
    .regex(/^[A-Z0-9_-]+$/, "Code must contain uppercase letters, numbers, _ or -"),
  description: z.string().trim().max(500).nullable().optional(),
});

export const updateProductCategorySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

export const productCategoryIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>;
export type UpdateProductCategoryInput = z.infer<typeof updateProductCategorySchema>;
