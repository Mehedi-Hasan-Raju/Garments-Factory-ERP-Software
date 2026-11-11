
import { z } from "zod";

const supplierTypes = [
  "MANUFACTURER",
  "DISTRIBUTOR",
  "WHOLESALER",
  "TRADER",
  "OTHER",
] as const;

const rawMaterialTypes = [
  "FABRIC",
  "ACCESSORIES",
  "THREAD",
  "BUTTON",
  "ZIPPER",
  "LABEL",
  "PACKAGING",
  "OTHER",
] as const;

const optionalEmail = z
  .string()
  .trim()
  .email("Invalid email address")
  .nullable()
  .optional();

export const createSupplierSchema = z.object({
  supplierCode: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .transform((value) => value.toUpperCase()),

  supplierName: z.string().trim().min(2).max(150),
  companyName: z.string().trim().min(2).max(150),
  contactPerson: z.string().trim().max(120).nullable().optional(),
  phone: z.string().trim().min(5).max(30),
  email: optionalEmail,
  address: z.string().trim().nullable().optional(),

  supplierType: z.enum(supplierTypes),
  rawMaterialTypes: z.array(z.enum(rawMaterialTypes)).default([]),

  notes: z.string().trim().nullable().optional(),
});

export const updateSupplierSchema = createSupplierSchema
  .omit({ supplierCode: true })
  .partial()
  .extend({
    supplierCode: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .transform((value) => value.toUpperCase())
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const supplierIdSchema = z.object({
  id: z.string().uuid("Invalid supplier ID"),
});

export const supplierQuerySchema = z.object({
  search: z.string().trim().optional(),
  supplierType: z.enum(supplierTypes).optional(),
  rawMaterialType: z.enum(rawMaterialTypes).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum(["supplierName", "companyName", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type SupplierQueryInput = z.infer<typeof supplierQuerySchema>;
