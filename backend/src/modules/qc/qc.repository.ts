import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateQCInspectionInput } from "./qc.validation.js";

export const qcRepository = {
  findByQCNumber(qcNumber: string) {
    return prisma.qCInspection.findUnique({
      where: { qcNumber },
    });
  },

  findById(id: string) {
    return prisma.qCInspection.findUnique({
      where: { id },
      include: {
        productionOrder: true,
        defects: true,
        finishedGoodsEntry: true,
      },
    });
  },

  async create(data: CreateQCInspectionInput, createdById: string) {
    return prisma.$transaction(
      async (tx) => {
        const order = await tx.productionOrder.findUnique({
          where: { id: data.productionOrderId },
        });

        if (!order) {
          throw new Error("PRODUCTION_ORDER_NOT_FOUND");
        }

        if (order.status !== "SEWING" && order.status !== "QC") {
          throw new Error("INVALID_PRODUCTION_ORDER_STATUS");
        }

        const inspected = new Prisma.Decimal(data.inspectedQuantity);
        const passed = new Prisma.Decimal(data.passedQuantity);
        const rejected = new Prisma.Decimal(data.rejectedQuantity);
        const rework = new Prisma.Decimal(data.reworkQuantity);

        if (!passed.plus(rejected).plus(rework).equals(inspected)) {
          throw new Error("QC_QUANTITY_MISMATCH");
        }

        const previous = await tx.qCInspection.aggregate({
          where: { productionOrderId: data.productionOrderId },
          _sum: { inspectedQuantity: true },
        });

        const previousInspected =
          previous._sum.inspectedQuantity ?? new Prisma.Decimal(0);

        if (previousInspected.plus(inspected).greaterThan(order.sewingQuantity)) {
          throw new Error("QC_EXCEEDS_SEWING");
        }

        const defectTotal = data.defects.reduce(
          (sum, defect) => sum + defect.defectQuantity,
          0,
        );

        if (defectTotal > data.rejectedQuantity) {
          throw new Error("DEFECT_EXCEEDS_REJECTED");
        }

        const inspection = await tx.qCInspection.create({
          data: {
            qcNumber: data.qcNumber,
            productionOrderId: data.productionOrderId,
            inspectionDate: data.inspectionDate,
            inspectedQuantity: inspected,
            passedQuantity: passed,
            rejectedQuantity: rejected,
            reworkQuantity: rework,
            notes: data.notes,
            createdById,
            defects: {
              create: data.defects.map((defect) => ({
                defectType: defect.defectType,
                severity: defect.severity,
                defectQuantity: new Prisma.Decimal(defect.defectQuantity),
                notes: defect.notes,
              })),
            },
          },
          include: {
            productionOrder: true,
            defects: true,
          },
        });

        await tx.productionOrder.update({
          where: { id: data.productionOrderId },
          data: { status: "QC" },
        });

        return inspection;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  },

  findMany(
    where: Prisma.QCInspectionWhereInput,
    skip: number,
    take: number,
  ) {
    return prisma.qCInspection.findMany({
      where,
      skip,
      take,
      orderBy: { inspectionDate: "desc" },
      include: {
        productionOrder: {
          select: {
            id: true,
            orderNumber: true,
            styleNumber: true,
            sewingQuantity: true,
            status: true,
          },
        },
        defects: true,
        finishedGoodsEntry: true,
      },
    });
  },

  count(where: Prisma.QCInspectionWhereInput) {
    return prisma.qCInspection.count({ where });
  },

  async getProductionOrderSummary(productionOrderId: string) {
    return prisma.qCInspection.aggregate({
      where: { productionOrderId },
      _sum: {
        inspectedQuantity: true,
        passedQuantity: true,
        rejectedQuantity: true,
        reworkQuantity: true,
      },
      _count: { id: true },
    });
  },
};