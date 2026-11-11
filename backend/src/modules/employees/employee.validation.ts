
import { z } from "zod";

const employmentTypes = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "TEMPORARY",
] as const;

const employeeStatuses = [
  "ACTIVE",
  "INACTIVE",
  "ON_LEAVE",
  "TERMINATED",
] as const;

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

export const createEmployeeSchema = z.object({
  employeeCode: z.string().trim().min(1).max(50),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),

  email: z.string().trim().email().max(150).nullable().optional(),
  phone: z.string().trim().min(5).max(30).nullable().optional(),

  designation: optionalText(100),

  employmentType: z.enum(employmentTypes).optional(),

  joiningDate: z.coerce.date().nullable().optional(),

  departmentId: z.string().uuid().nullable().optional(),
});

export const updateEmployeeSchema = z
  .object({
    employeeCode: z.string().trim().min(1).max(50).optional(),
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),

    email: z.string().trim().email().max(150).nullable().optional(),
    phone: z.string().trim().min(5).max(30).nullable().optional(),

    designation: optionalText(100),

    employmentType: z.enum(employmentTypes).optional(),

    joiningDate: z.coerce.date().nullable().optional(),

    departmentId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const updateEmployeeStatusSchema = z.object({
  status: z.enum(employeeStatuses),
});

export const employeeIdSchema = z.object({
  id: z.string().uuid(),
});

export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  search: z.string().trim().optional(),

  status: z.enum(employeeStatuses).optional(),

  employmentType: z.enum(employmentTypes).optional(),

  departmentId: z.string().uuid().optional(),
});

export type CreateEmployeeInput = z.infer<
  typeof createEmployeeSchema
>;

export type UpdateEmployeeInput = z.infer<
  typeof updateEmployeeSchema
>;

export type UpdateEmployeeStatusInput = z.infer<
  typeof updateEmployeeStatusSchema
>;

export type EmployeeQueryInput = z.infer<
  typeof employeeQuerySchema
>;
