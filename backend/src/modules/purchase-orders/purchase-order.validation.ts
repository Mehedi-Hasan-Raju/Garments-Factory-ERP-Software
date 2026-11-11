import { z } from "zod";

const uuidSchema = z.string().uuid();

const purchaseOrderItemSchema = z.object({
  productId: uuidSchema,
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  notes: z.string().trim().max(2000).optional(),
});

export const createPurchaseOrderSchema = z.object({
  poNumber: z.string().trim().min(2).max(50),
  supplierId: uuidSchema,
  warehouseId: uuidSchema,
  orderDate: z.coerce.date().optional(),
  expectedDeliveryDate: z.coerce.date().optional(),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  notes: z.string().trim().max(5000).optional(),
  termsAndConditions: z.string().trim().max(10000).optional(),
  items: z.array(purchaseOrderItemSchema).min(1),
}).superRefine((data, ctx) => {
  if (
    data.expectedDeliveryDate &&
    data.orderDate &&
    data.expectedDeliveryDate < data.orderDate
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["expectedDeliveryDate"],
      message: "Expected delivery date cannot be before order date",
    });
  }
});

export const updatePurchaseOrderSchema = z.object({
  expectedDeliveryDate: z.coerce.date().optional(),
  discount: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  termsAndConditions: z.string().trim().max(10000).nullable().optional(),
  items: z.array(purchaseOrderItemSchema).min(1).optional(),
});

export const purchaseOrderQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum([
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "PARTIALLY_RECEIVED",
    "RECEIVED",
    "CANCELLED",
  ]).optional(),
  supplierId: uuidSchema.optional(),
  warehouseId: uuidSchema.optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const receivePurchaseOrderSchema = z.object({
  items: z.array(
    z.object({
      purchaseOrderItemId: uuidSchema,
      quantity: z.coerce.number().positive(),
      locationId: uuidSchema,
      batchNo: z.string().trim().min(1).max(100),
      expiryDate: z.coerce.date().optional(),
      description: z.string().trim().max(2000).optional(),
    }),
  ).min(1),
}).superRefine((data, ctx) => {
  const ids = data.items.map((item) => item.purchaseOrderItemId);

  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({
      code: "custom",
      path: ["items"],
      message: "Each purchase order item can appear only once per receiving request",
    });
  }
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type PurchaseOrderQuery = z.infer<typeof purchaseOrderQuerySchema>;
export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>;