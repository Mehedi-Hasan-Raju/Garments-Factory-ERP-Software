import { z } from "zod";

export const createBuyerSchema = z.object({
  buyerCode: z.string().trim().min(1).max(50),

  name: z.string().trim().min(1).max(150),

  companyName: z.string().trim().max(150).optional().nullable(),

  country: z.string().trim().min(1).max(100),

  address: z.string().trim().max(5000).optional().nullable(),

  contactPerson: z.string().trim().max(120).optional().nullable(),

  designation: z.string().trim().max(100).optional().nullable(),

  phone: z.string().trim().max(30).optional().nullable(),

  email: z.string().trim().email().max(150).optional().nullable(),

  notes: z.string().trim().max(5000).optional().nullable(),

  buyingHouseId: z.string().uuid(),
});

export const updateBuyerSchema = createBuyerSchema.partial();

export const buyerQuerySchema = z.object({
  search: z.string().trim().optional(),

  country: z.string().trim().optional(),

  buyingHouseId: z.string().uuid().optional(),

  isActive: z.enum(["true", "false"]).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const buyerIdSchema = z.object({
  id: z.string().uuid(),
});

export const buyerStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateBuyerInput = z.infer<typeof createBuyerSchema>;
export type UpdateBuyerInput = z.infer<typeof updateBuyerSchema>;
export type BuyerQueryInput = z.infer<typeof buyerQuerySchema>;
