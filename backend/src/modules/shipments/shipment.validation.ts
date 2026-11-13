import { z } from "zod";

export const createShipmentSchema = z.object({
  shipmentNumber: z.string().trim().min(1).max(50),
  productionOrderId: z.string().uuid(),

  shipmentDate: z.coerce.date().optional(),
  expectedDeliveryDate: z.coerce.date().optional(),

  shippingMethod: z.string().trim().max(100).optional(),
  carrierName: z.string().trim().max(150).optional(),
  trackingNumber: z.string().trim().max(150).optional(),
  destination: z.string().trim().optional(),
  notes: z.string().trim().optional(),

  items: z.array(
    z.object({
      finishedGoodsEntryId: z.string().uuid(),
      quantity: z.coerce.number().positive(),
    })
  ).min(1),
}).superRefine((data, ctx) => {
  const ids = data.items.map((item) => item.finishedGoodsEntryId);

  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({
      code: "custom",
      message: "Duplicate finished goods entries are not allowed.",
      path: ["items"],
    });
  }
});

export const updateShipmentStatusSchema = z.object({
  status: z.enum([
    "READY",
    "DISPATCHED",
    "DELIVERED",
    "CANCELLED",
  ]),
  location: z.string().trim().max(255).optional(),
  notes: z.string().trim().optional(),
});

export const createShipmentEventSchema = z.object({
  eventDate: z.coerce.date().optional(),
  location: z.string().trim().max(255).optional(),
  notes: z.string().trim().optional(),
});

export const shipmentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const productionOrderIdParamSchema = z.object({
  productionOrderId: z.string().uuid(),
});

export const shipmentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum([
    "PLANNED",
    "READY",
    "DISPATCHED",
    "DELIVERED",
    "CANCELLED",
  ]).optional(),
  productionOrderId: z.string().uuid().optional(),
});

export type CreateShipmentInput = z.infer<
  typeof createShipmentSchema
>;

export type UpdateShipmentStatusInput = z.infer<
  typeof updateShipmentStatusSchema
>;

export type CreateShipmentEventInput = z.infer<
  typeof createShipmentEventSchema
>;

export type ShipmentListQuery = z.infer<
  typeof shipmentListQuerySchema
>;
