
import { z } from "zod";

const moneySchema = z.string()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, "Amount must be a valid BDT amount");

export const assignEmployeeSalarySchema = z.object({
  basicSalary: moneySchema,
  effectiveFrom: z.coerce.date(),
  note: z.string().trim().max(1000).nullable().optional(),

  components: z.array(
    z.object({
      componentId: z.string().uuid(),
      amount: moneySchema,
    })
  ).default([]),
});

export const employeeSalaryParamsSchema = z.object({
  id: z.string().uuid(),
});

export type AssignEmployeeSalaryInput = z.infer<
  typeof assignEmployeeSalarySchema
>;
