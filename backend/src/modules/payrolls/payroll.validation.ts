
import { z } from "zod";

const moneySchema = z.string()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, "Enter a valid BDT amount");

export const generatePayrollSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export const payrollIdSchema = z.object({
  id: z.string().uuid(),
});

export const payrollItemParamsSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
});

export const updatePayrollAdjustmentSchema = z.object({
  overtimeAmount: moneySchema.optional(),
  bonusAmount: moneySchema.optional(),
  otherDeduction: moneySchema.optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one adjustment is required",
});

export type GeneratePayrollInput = z.infer<typeof generatePayrollSchema>;
export type UpdatePayrollAdjustmentInput = z.infer<
  typeof updatePayrollAdjustmentSchema
>;
