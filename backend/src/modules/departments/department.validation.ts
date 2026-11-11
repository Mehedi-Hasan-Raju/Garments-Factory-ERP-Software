import { z } from "zod";

const departmentFields = {
  name: z
    .string()
    .trim()
    .min(2, "Department name must contain at least 2 characters")
    .max(100, "Department name cannot exceed 100 characters"),

  code: z
    .string()
    .trim()
    .min(2, "Department code must contain at least 2 characters")
    .max(30, "Department code cannot exceed 30 characters")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Department code can only contain letters, numbers, _ and -",
    )
    .transform((value) => value.toUpperCase()),

  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .nullable()
    .optional(),
};

export const createDepartmentSchema = z
  .object(departmentFields)
  .strict();

export const updateDepartmentSchema = z
  .object({
    name: departmentFields.name.optional(),
    code: departmentFields.code.optional(),
    description: departmentFields.description,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const departmentStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export const departmentIdSchema = z.string().uuid();

export const departmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export type CreateDepartmentInput = z.infer<
  typeof createDepartmentSchema
>;

export type UpdateDepartmentInput = z.infer<
  typeof updateDepartmentSchema
>;
