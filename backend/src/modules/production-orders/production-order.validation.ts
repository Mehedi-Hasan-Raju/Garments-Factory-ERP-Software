import { z } from "zod";

const uuidSchema = z.string().uuid();

export const productionOrderStatusValues = [
  "PENDING",
  "CUTTING",
  "SEWING",
  "QC",
  "COMPLETED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export const createProductionOrderSchema = z.object({
  orderNumber: z.string().trim().min(2).max(50),

  buyingHouseId: uuidSchema,
  buyerId: uuidSchema,
  productId: uuidSchema,

  styleNumber: z.string().trim().min(1).max(100),
  designImageUrl: z.string().trim().url().max(1000).optional().nullable(),

  orderQuantity: z.coerce.number().positive(),

  fabricRequirement: z.coerce.number().min(0).default(0),
  fabricRequirementUnit: z.string().trim().min(1).max(20).default("KG"),

  targetPrice: z.coerce.number().min(0),
  currency: z.string().trim().length(3).default("BDT"),

  paymentTerms: z.string().trim().max(5000).optional().nullable(),

  orderDate: z.coerce.date().optional(),
  deliveryDate: z.coerce.date(),

  notes: z.string().trim().max(5000).optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.orderDate && data.deliveryDate < data.orderDate) {
    ctx.addIssue({
      code: "custom",
      path: ["deliveryDate"],
      message: "Delivery date cannot be before order date",
    });
  }
});

export const updateProductionOrderSchema = z.object({
  buyingHouseId: uuidSchema.optional(),
  buyerId: uuidSchema.optional(),
  productId: uuidSchema.optional(),

  styleNumber: z.string().trim().min(1).max(100).optional(),
  designImageUrl: z.string().trim().url().max(1000).nullable().optional(),

  orderQuantity: z.coerce.number().positive().optional(),

  fabricRequirement: z.coerce.number().min(0).optional(),
  fabricRequirementUnit: z.string().trim().min(1).max(20).optional(),

  targetPrice: z.coerce.number().min(0).optional(),
  currency: z.string().trim().length(3).optional(),

  paymentTerms: z.string().trim().max(5000).nullable().optional(),

  orderDate: z.coerce.date().optional(),
  deliveryDate: z.coerce.date().optional(),

  notes: z.string().trim().max(5000).nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.orderDate && data.deliveryDate && data.deliveryDate < data.orderDate) {
    ctx.addIssue({
      code: "custom",
      path: ["deliveryDate"],
      message: "Delivery date cannot be before order date",
    });
  }
});

export const productionOrderProgressSchema = z.object({
  cuttingQuantity: z.coerce.number().min(0).optional(),
  sewingQuantity: z.coerce.number().min(0).optional(),
  rejectedQuantity: z.coerce.number().min(0).optional(),
  finishedGoodsQuantity: z.coerce.number().min(0).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one progress field is required" },
);

export const productionOrderStatusSchema = z.object({
  status: z.enum(productionOrderStatusValues),
});

export const productionOrderQuerySchema = z.object({
  search: z.string().trim().optional(),

  status: z.enum(productionOrderStatusValues).optional(),

  shipmentStatus: z.enum([
    "NOT_SHIPPED",
    "READY",
    "PARTIALLY_SHIPPED",
    "SHIPPED",
    "DELIVERED",
  ]).optional(),

  buyingHouseId: uuidSchema.optional(),
  buyerId: uuidSchema.optional(),
  productId: uuidSchema.optional(),

  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).superRefine((data, ctx) => {
  if (data.fromDate && data.toDate && data.toDate < data.fromDate) {
    ctx.addIssue({
      code: "custom",
      path: ["toDate"],
      message: "toDate cannot be before fromDate",
    });
  }
});

export const productionOrderIdSchema = z.object({
  id: uuidSchema,
});

export type CreateProductionOrderInput =
  z.infer<typeof createProductionOrderSchema>;

export type UpdateProductionOrderInput =
  z.infer<typeof updateProductionOrderSchema>;

export type ProductionOrderProgressInput =
  z.infer<typeof productionOrderProgressSchema>;

export type ProductionOrderQuery =
  z.infer<typeof productionOrderQuerySchema>;

export type ProductionOrderStatusInput =
  z.infer<typeof productionOrderStatusSchema>;