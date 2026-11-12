import { z } from "zod";

const allocationSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  amount: z.coerce.number().positive(),
});

export const createSupplierPaymentSchema = z
  .object({
    supplierId: z.string().uuid(),
    amount: z.coerce.number().positive(),
    paymentMethod: z.enum([
      "CASH",
      "BANK_TRANSFER",
      "CHEQUE",
      "MOBILE_BANKING",
      "OTHER",
    ]),
    paymentDate: z.coerce.date().optional(),
    transactionReference: z.string().trim().max(150).optional().nullable(),
    chequeNumber: z.string().trim().max(100).optional().nullable(),
    bankName: z.string().trim().max(150).optional().nullable(),
    notes: z.string().trim().max(5000).optional().nullable(),
    allocations: z.array(allocationSchema).default([]),
  })
  .superRefine((data, ctx) => {
    const ids = data.allocations.map((item) => item.purchaseOrderId);

    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["allocations"],
        message: "Duplicate purchase order allocation is not allowed.",
      });
    }

    const allocated = data.allocations.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    if (allocated > data.amount) {
      ctx.addIssue({
        code: "custom",
        path: ["allocations"],
        message: "Allocated amount cannot exceed payment amount.",
      });
    }
  });

export const allocateSupplierPaymentSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  amount: z.coerce.number().positive(),
});

export const cancelSupplierPaymentSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

export const supplierPaymentParamsSchema = z.object({
  id: z.string().uuid(),
});

export const supplierPaymentListQuerySchema = z
  .object({
    supplierId: z.string().uuid().optional(),
    status: z.enum(["COMPLETED", "CANCELLED"]).optional(),
    paymentMethod: z
      .enum(["CASH", "BANK_TRANSFER", "CHEQUE", "MOBILE_BANKING", "OTHER"])
      .optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    (data) =>
      !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo,
    {
      message: "dateFrom cannot be later than dateTo.",
      path: ["dateTo"],
    },
    );

export type CreateSupplierPaymentInput = z.infer<
  typeof createSupplierPaymentSchema
>;

export type AllocateSupplierPaymentInput = z.infer<
  typeof allocateSupplierPaymentSchema
>;

export type SupplierPaymentListQuery = z.infer<
  typeof supplierPaymentListQuerySchema
>;