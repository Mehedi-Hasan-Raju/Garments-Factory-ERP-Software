import { z } from "zod";

const uuidSchema = z.string().uuid();

const positiveQuantity = z.coerce.number().positive();
const nonNegativeQuantity = z.coerce.number().min(0);

export const receiveStockSchema = z.object({
  productId: uuidSchema,
  locationId: uuidSchema,
  batchNo: z.string().trim().min(1).max(100),
  expiryDate: z.coerce.date().optional(),
  quantity: positiveQuantity,
  minimumStock: nonNegativeQuantity.optional(),
  referenceNo: z.string().trim().max(100).optional(),
  note: z.string().trim().max(2000).optional(),
});

export const issueStockSchema = z.object({
  productId: uuidSchema,
  locationId: uuidSchema,
  batchLotId: uuidSchema,
  quantity: positiveQuantity,
  referenceNo: z.string().trim().max(100).optional(),
  note: z.string().trim().max(2000).optional(),
});

export const transferStockSchema = z.object({
  productId: uuidSchema,
  batchLotId: uuidSchema,
  fromLocationId: uuidSchema,
  toLocationId: uuidSchema,
  quantity: positiveQuantity,
  referenceNo: z.string().trim().max(100).optional(),
  note: z.string().trim().max(2000).optional(),
});

export const adjustmentStockSchema = z.object({
  productId: uuidSchema,
  locationId: uuidSchema,
  batchLotId: uuidSchema,
  direction: z.enum(["INCREASE", "DECREASE"]),
  quantity: positiveQuantity,
  referenceNo: z.string().trim().max(100).optional(),
  note: z.string().trim().max(2000).optional(),
});

export const countStockSchema = z.object({
  productId: uuidSchema,
  locationId: uuidSchema,
  batchLotId: uuidSchema,
  actualQuantity: nonNegativeQuantity,
  referenceNo: z.string().trim().max(100).optional(),
  note: z.string().trim().max(2000).optional(),
});

export const stockListQuerySchema = z.object({
  productId: uuidSchema.optional(),
  locationId: uuidSchema.optional(),
  batchLotId: uuidSchema.optional(),
  search: z.string().trim().max(150).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const historyQuerySchema = z.object({
  productId: uuidSchema.optional(),
  locationId: uuidSchema.optional(),
  batchLotId: uuidSchema.optional(),
  type: z.enum(["RECEIVE", "ISSUE", "TRANSFER", "ADJUSTMENT"]).optional(),
  referenceNo: z.string().trim().max(100).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).refine(
  (data) => !data.fromDate || !data.toDate || data.fromDate <= data.toDate,
  { message: "fromDate cannot be later than toDate" }
);

export const inventoryIdSchema = z.object({
  id: uuidSchema,
});

export type ReceiveStockInput = z.infer<typeof receiveStockSchema>;
export type IssueStockInput = z.infer<typeof issueStockSchema>;
export type TransferStockInput = z.infer<typeof transferStockSchema>;
export type AdjustmentStockInput = z.infer<typeof adjustmentStockSchema>;
export type CountStockInput = z.infer<typeof countStockSchema>;
export type StockListQuery = z.infer<typeof stockListQuerySchema>;
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
