import { z } from "zod";

export const createBuyingHouseSchema = z.object({
  code: z.string().trim().min(1).max(50),

  name: z.string().trim().min(1).max(150),

  companyName: z.string().trim().min(1).max(150),

  country: z.string().trim().min(1).max(100),

  address: z.string().trim().max(5000).optional().nullable(),

  contactPerson: z.string().trim().max(120).optional().nullable(),

  phone: z.string().trim().max(30).optional().nullable(),

  email: z.string().trim().email().max(150).optional().nullable(),

  website: z.string().trim().url().max(255).optional().nullable(),

  notes: z.string().trim().max(5000).optional().nullable(),
});

export const updateBuyingHouseSchema =
  createBuyingHouseSchema.partial();

export const buyingHouseQuerySchema = z.object({
  search: z.string().trim().optional(),

  country: z.string().trim().optional(),

  isActive: z.enum(["true", "false"]).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const buyingHouseIdSchema = z.object({
  id: z.string().uuid(),
});

export const buyingHouseStatusSchema = z.object({
  isActive: z.boolean(),
});