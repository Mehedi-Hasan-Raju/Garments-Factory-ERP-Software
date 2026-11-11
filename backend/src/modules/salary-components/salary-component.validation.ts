
import { z } from "zod";

export const createSalaryComponentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(2).max(50).regex(/^[A-Z0-9_]+$/),
  type: z.enum(["EARNING", "DEDUCTION"]),
  description: z.string().trim().max(1000).nullable().optional(),
});

export const updateSalaryComponentSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

export const salaryComponentIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateSalaryComponentInput = z.infer<
  typeof createSalaryComponentSchema
>;

export type UpdateSalaryComponentInput = z.infer<
  typeof updateSalaryComponentSchema
>;
