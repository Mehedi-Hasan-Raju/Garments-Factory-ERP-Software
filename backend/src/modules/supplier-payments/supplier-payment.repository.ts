import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

const paymentInclude = {
  supplier: {
    select: {
      id: true,
      supplierCode: true,
      supplierName: true,
      companyName: true,
      phone: true,
    },
  },
  allocations: {
    include: {
      purchaseOrder: {
        select: {
          id: true,
          poNumber: true,
          status: true,
          totalAmount: true,
        },
      },
    },
  },
} satisfies Prisma.SupplierPaymentInclude;

export const supplierPaymentRepository = {
  findSupplier(tx: Prisma.TransactionClient, supplierId: string) {
    return tx.supplier.findUnique({
      where: { id: supplierId },
      select: {
        id: true,
        supplierCode: true,
        supplierName: true,
        isActive: true,
      },
    });
  },

  findPurchaseOrdersForAllocation(
    tx: Prisma.TransactionClient,
    ids: string[],
  ) {
    return tx.purchaseOrder.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        poNumber: true,
        supplierId: true,
        status: true,
        totalAmount: true,
        paymentAllocations: {
          where: {
            payment: { status: "COMPLETED" },
          },
          select: { amount: true },
        },
      },
    });
  },

  create(
    tx: Prisma.TransactionClient,
    data: {
      paymentNo: string;
      supplierId: string;
      amount: Prisma.Decimal;
      paymentMethod:
        | "CASH"
        | "BANK_TRANSFER"
        | "CHEQUE"
        | "MOBILE_BANKING"
        | "OTHER";
      paymentDate: Date;
      transactionReference?: string | null;
      chequeNumber?: string | null;
      bankName?: string | null;
      notes?: string | null;
      createdById: string;
      allocations: {
        purchaseOrderId: string;
        amount: Prisma.Decimal;
      }[];
    },
  ) {
    return tx.supplierPayment.create({
      data: {
        paymentNo: data.paymentNo,
        supplierId: data.supplierId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        transactionReference: data.transactionReference,
        chequeNumber: data.chequeNumber,
        bankName: data.bankName,
        notes: data.notes,
        createdById: data.createdById,
        allocations: {
          create: data.allocations,
        },
      },
      include: paymentInclude,
    });
  },

  findPaymentForAllocation(
    tx: Prisma.TransactionClient,
    paymentId: string,
  ) {
    return tx.supplierPayment.findUnique({
      where: { id: paymentId },
      include: {
        allocations: {
          select: {
            purchaseOrderId: true,
            amount: true,
          },
        },
      },
    });
  },
  findPurchaseOrderForAllocation(
    tx: Prisma.TransactionClient,
    purchaseOrderId: string,
  ) {
    return tx.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      select: {
        id: true,
        poNumber: true,
        supplierId: true,
        status: true,
        totalAmount: true,
        paymentAllocations: {
          where: {
            payment: { status: "COMPLETED" },
          },
          select: { amount: true },
        },
      },
    });
  },

  createAllocation(
    tx: Prisma.TransactionClient,
    data: {
      paymentId: string;
      purchaseOrderId: string;
      amount: Prisma.Decimal;
    },
  ) {
    return tx.supplierPaymentAllocation.create({
      data,
    });
  },

  findById(id: string) {
    return prisma.supplierPayment.findUnique({
      where: { id },
      include: paymentInclude,
    });
  },

  findForCancellation(tx: Prisma.TransactionClient, id: string) {
    return tx.supplierPayment.findUnique({
      where: { id },
      select: {
        id: true,
        paymentNo: true,
        status: true,
      },
    });
  },

  cancel(
    tx: Prisma.TransactionClient,
    id: string,
    data: {
      cancelledAt: Date;
      cancelledById: string;
      cancellationReason: string;
    },
  ) {
    return tx.supplierPayment.update({
      where: { id },
      data: {
        status: "CANCELLED",
        ...data,
      },
      include: paymentInclude,
    });
  },

  async list(query: {
    supplierId?: string;
    status?: "COMPLETED" | "CANCELLED";
    paymentMethod?:
      | "CASH"
      | "BANK_TRANSFER"
      | "CHEQUE"
      | "MOBILE_BANKING"
      | "OTHER";
    dateFrom?: Date;
    dateTo?: Date;
    page: number;
    limit: number;
  }) {
    const where: Prisma.SupplierPaymentWhereInput = {
      ...(query.supplierId && { supplierId: query.supplierId }),
      ...(query.status && { status: query.status }),
      ...(query.paymentMethod && {
        paymentMethod: query.paymentMethod,
      }),
      ...(query.dateFrom || query.dateTo
        ? {
            paymentDate: {
              ...(query.dateFrom && { gte: query.dateFrom }),
              ...(query.dateTo && { lte: query.dateTo }),
            },
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.supplierPayment.findMany({
        where,
        include: paymentInclude,
        orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.supplierPayment.count({ where }),
    ]);

    return { items, total };
  },

  async getSupplierSummary(supplierId: string) {
    const [supplier, orders, payments] = await prisma.$transaction([
      prisma.supplier.findUnique({
        where: { id: supplierId },
        select: {
          id: true,
          supplierCode: true,
          supplierName: true,
          companyName: true,
          isActive: true,
        },
      }),

      prisma.purchaseOrder.findMany({
        where: {
          supplierId,
          status: {
            in: ["APPROVED", "PARTIALLY_RECEIVED", "RECEIVED"],
          },
        },
        select: {
          id: true,
          poNumber: true,
          status: true,
          orderDate: true,
          totalAmount: true,
          paymentAllocations: {
            where: {
              payment: { status: "COMPLETED" },
            },
            select: { amount: true },
          },
        },
        orderBy: { orderDate: "desc" },
      }),

      prisma.supplierPayment.findMany({
        where: {
          supplierId,
          status: "COMPLETED",
        },
        select: {
          amount: true,
          allocations: {
            select: { amount: true },
          },
        },
      }),
    ]);

    return { supplier, orders, payments };
  },
};