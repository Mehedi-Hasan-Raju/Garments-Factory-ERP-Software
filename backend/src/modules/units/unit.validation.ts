
import { z } from "zod";

export const createUnitSchema = z.object({
  name: z.string().trim().min(2).max(50),
  code: z.string().trim().min(1).max(20)
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code must contain uppercase letters, numbers, _ or -",
    ),
  description: z.string().trim().max(500).nullable().optional(),
});

export const updateUnitSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

export const unitIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
