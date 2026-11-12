import { randomUUID } from "node:crypto";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";

import { supplierPaymentRepository as repository } from "./supplier-payment.repository.js";

import type {
  CreateSupplierPaymentInput,
  AllocateSupplierPaymentInput,
  SupplierPaymentListQuery,
} from "./supplier-payment.validation.js";

const allowedOrderStatuses = [
  "APPROVED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
] as const;

function decimalSum(values: Prisma.Decimal[]) {
  return values.reduce(
    (sum, value) => sum.plus(value),
    new Prisma.Decimal(0),
  );
}

function validateOrderStatus(status: string) {
  if (!allowedOrderStatuses.includes(status as (typeof allowedOrderStatuses)[number])) {
    throw new AppError(
      `Payment cannot be allocated to a purchase order with status ${status}.`,
      400,
    );
  }
}

export const supplierPaymentService = {
  async create(data: CreateSupplierPaymentInput, createdById: string) {
    return prisma.$transaction(
      async (tx) => {
        const supplier = await repository.findSupplier(tx, data.supplierId);

        if (!supplier) {
          throw new AppError("Supplier not found.", 404);
        }

        if (!supplier.isActive) {
          throw new AppError(
            "Payment cannot be created for an inactive supplier.",
            400,
          );
        }

        const paymentAmount = new Prisma.Decimal(data.amount);

        const allocations = data.allocations.map((item) => ({
          purchaseOrderId: item.purchaseOrderId,
          amount: new Prisma.Decimal(item.amount),
        }));

        const allocatedAmount = decimalSum(
          allocations.map((item) => item.amount),
        );

        if (allocatedAmount.greaterThan(paymentAmount)) {
          throw new AppError(
            "Allocated amount cannot exceed payment amount.",
            400,
          );
        }

        if (allocations.length > 0) {
          const orderIds = allocations.map((item) => item.purchaseOrderId);

          const orders = await repository.findPurchaseOrdersForAllocation(
            tx,
            orderIds,
          );

          if (orders.length !== orderIds.length) {
            throw new AppError(
              "One or more purchase orders were not found.",
              404,
            );
          }

          for (const allocation of allocations) {
            const order = orders.find(
              (item) => item.id === allocation.purchaseOrderId,
            );

            if (!order) {
              throw new AppError("Purchase order not found.", 404);
            }

            if (order.supplierId !== data.supplierId) {
              throw new AppError(
                `Purchase order ${order.poNumber} belongs to another supplier.`,
                400,
              );
            }

            validateOrderStatus(order.status);

            const alreadyPaid = decimalSum(
              order.paymentAllocations.map(
                (item) => new Prisma.Decimal(item.amount),
              ),
            );

            const outstanding = new Prisma.Decimal(
              order.totalAmount,
            ).minus(alreadyPaid);

            if (allocation.amount.greaterThan(outstanding)) {
              throw new AppError(
                `Allocation exceeds outstanding amount for PO ${order.poNumber}. Outstanding: ${outstanding.toString()}`,
                400,
              );
            }
          }
        }

        const paymentNo = `SP-${Date.now()}-${randomUUID()
          .slice(0, 8)
          .toUpperCase()}`;

        return repository.create(tx, {
          paymentNo,
          supplierId: data.supplierId,
          amount: paymentAmount,
          paymentMethod: data.paymentMethod,
          paymentDate: data.paymentDate ?? new Date(),
          transactionReference: data.transactionReference,
          chequeNumber: data.chequeNumber,
          bankName: data.bankName,
          notes: data.notes,
          createdById,
          allocations,
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  },

  async allocate(
    paymentId: string,
    data: AllocateSupplierPaymentInput,
  ) {
    return prisma.$transaction(
      async (tx) => {
        const payment = await repository.findPaymentForAllocation(
          tx,
          paymentId,
        );

        if (!payment) {
          throw new AppError("Supplier payment not found.", 404);
        }

        if (payment.status !== "COMPLETED") {
          throw new AppError(
            "Cannot allocate a cancelled payment.",
            400,
          );
        }

        const order = await repository.findPurchaseOrderForAllocation(
          tx,
          data.purchaseOrderId,
        );

        if (!order) {
          throw new AppError("Purchase order not found.", 404);
        }

        if (order.supplierId !== payment.supplierId) {
          throw new AppError(
            "This purchase order belongs to another supplier.",
            400,
          );
        }

        validateOrderStatus(order.status);

        if (
          payment.allocations.some(
            (item) => item.purchaseOrderId === data.purchaseOrderId,
          )
        ) {
          throw new AppError(
            "This payment is already allocated to this purchase order.",
            409,
          );
        }

        const paymentAllocated = decimalSum(
          payment.allocations.map(
            (item) => new Prisma.Decimal(item.amount),
          ),
        );

        const paymentRemaining = new Prisma.Decimal(
          payment.amount,
        ).minus(paymentAllocated);

        const allocationAmount = new Prisma.Decimal(data.amount);

        if (allocationAmount.greaterThan(paymentRemaining)) {
          throw new AppError(
            `Allocation exceeds unallocated payment balance. Available: ${paymentRemaining.toString()}`,
            400,
          );
        }

        const orderPaid = decimalSum(
          order.paymentAllocations.map(
            (item) => new Prisma.Decimal(item.amount),
          ),
        );

        const orderOutstanding = new Prisma.Decimal(
          order.totalAmount,
        ).minus(orderPaid);

        if (allocationAmount.greaterThan(orderOutstanding)) {
          throw new AppError(
            `Allocation exceeds purchase order outstanding. Outstanding: ${orderOutstanding.toString()}`,
            400,
          );
        }

        return repository.createAllocation(tx, {
          paymentId,
          purchaseOrderId: data.purchaseOrderId,
          amount: allocationAmount,
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  },

  async cancel(
    paymentId: string,
    cancelledById: string,
    reason: string,
  ) {
    return prisma.$transaction(
      async (tx) => {
        const payment = await repository.findForCancellation(tx, paymentId);

        if (!payment) {
          throw new AppError("Supplier payment not found.", 404);
        }

        if (payment.status === "CANCELLED") {
          throw new AppError("Payment is already cancelled.", 400);
        }

        return repository.cancel(tx, paymentId, {
          cancelledAt: new Date(),
          cancelledById,
          cancellationReason: reason,
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  },

  async getById(id: string) {
    const payment = await repository.findById(id);

    if (!payment) {
      throw new AppError("Supplier payment not found.", 404);
    }

    return payment;
  },

  async list(query: SupplierPaymentListQuery) {
    const { items, total } = await repository.list(query);

    return {
      items,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getSupplierSummary(supplierId: string) {
    const { supplier, orders, payments } =
      await repository.getSupplierSummary(supplierId);

    if (!supplier) {
      throw new AppError("Supplier not found.", 404);
    }

    const purchaseOrderBalances = orders.map((order) => {
      const paid = decimalSum(
        order.paymentAllocations.map(
          (item) => new Prisma.Decimal(item.amount),
        ),
      );

      const total = new Prisma.Decimal(order.totalAmount);
      const outstanding = total.minus(paid);

      return {
        purchaseOrderId: order.id,
        poNumber: order.poNumber,
        status: order.status,
        orderDate: order.orderDate,
        totalAmount: total.toFixed(2),
        paidAmount: paid.toFixed(2),
        outstandingAmount: outstanding.toFixed(2),
      };
    });

    const totalPurchaseAmount = decimalSum(
      orders.map((order) => new Prisma.Decimal(order.totalAmount)),
    );

    const totalPayments = decimalSum(
      payments.map((payment) => new Prisma.Decimal(payment.amount)),
    );

    const totalAllocated = decimalSum(
      payments.flatMap((payment) =>
        payment.allocations.map(
          (allocation) => new Prisma.Decimal(allocation.amount),
        ),
      ),
    );

    const grossOutstanding = totalPurchaseAmount.minus(totalAllocated);
    const advanceBalance = totalPayments.minus(totalAllocated);
    const netPayable = grossOutstanding.minus(advanceBalance);

    return {
      supplier,
      summary: {
        totalPurchaseAmount: totalPurchaseAmount.toFixed(2),
        totalPayments: totalPayments.toFixed(2),
        totalAllocated: totalAllocated.toFixed(2),
        grossOutstanding: grossOutstanding.toFixed(2),
        advanceBalance: advanceBalance.toFixed(2),
        netPayable: netPayable.toFixed(2),
      },
      purchaseOrderBalances,
    };
  },
};