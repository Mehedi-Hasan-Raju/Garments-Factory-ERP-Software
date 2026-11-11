
import { prisma } from "../../lib/prisma.js";

export const payrollRepository = {
  findByPeriod(year: number, month: number) {
    return prisma.payroll.findUnique({
      where: {
        year_month: { year, month },
      },
    });
  },

  findEligibleEmployees(monthStart: Date, monthEnd: Date) {
    return prisma.employee.findMany({
      where: {
        status: "ACTIVE",
        salaries: {
          some: {
            effectiveFrom: { lte: monthEnd },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: monthStart } },
            ],
          },
        },
      },
      include: {
        salaries: {
          where: {
            effectiveFrom: { lte: monthEnd },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: monthStart } },
            ],
          },
          include: {
            components: {
              include: {
                component: true,
              },
            },
          },
          orderBy: { effectiveFrom: "asc" },
        },
      },
    });
  },

  create(data: {
    year: number;
    month: number;
    totalBasicSalary: string;
    totalEarnings: string;
    totalDeductions: string;
    totalOvertime: string;
    totalBonus: string;
    totalNetSalary: string;
    items: {
      employeeId: string;
      basicSalary: string;
      overtimeAmount: string;
      bonusAmount: string;
      otherDeduction: string;
      grossSalary: string;
      totalDeductions: string;
      netSalary: string;
      daysInMonth: number;
      paidDays: number;
      components: {
        componentId: string;
        componentName: string;
        componentCode: string;
        type: "EARNING" | "DEDUCTION";
        amount: string;
      }[];
    }[];
  }) {
    return prisma.$transaction(async (tx) => {
      return tx.payroll.create({
        data: {
          year: data.year,
          month: data.month,
          currency: "BDT",
          totalBasicSalary: data.totalBasicSalary,
          totalEarnings: data.totalEarnings,
          totalDeductions: data.totalDeductions,
          totalOvertime: data.totalOvertime,
          totalBonus: data.totalBonus,
          totalNetSalary: data.totalNetSalary,
          items: {
            create: data.items.map((item) => ({
              employeeId: item.employeeId,
              basicSalary: item.basicSalary,
              overtimeAmount: item.overtimeAmount,
              bonusAmount: item.bonusAmount,
              otherDeduction: item.otherDeduction,
              grossSalary: item.grossSalary,
              totalDeductions: item.totalDeductions,
              netSalary: item.netSalary,
              daysInMonth: item.daysInMonth,
              paidDays: item.paidDays,
              components: {
                create: item.components,
              },
            })),
          },
        },
        include: {
          items: {
            include: {
              employee: true,
              components: true,
            },
          },
        },
      });
    });
  },

  findAll() {
    return prisma.payroll.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        _count: { select: { items: true } },
      },
    });
  },

  findById(id: string) {
    return prisma.payroll.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                departmentId: true,
              },
            },
            components: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },

  async updateAdjustment(
    payrollId: string,
    itemId: string,
    data: {
      overtimeAmount: string;
      bonusAmount: string;
      otherDeduction: string;
      grossSalary: string;
      totalDeductions: string;
      netSalary: string;
      totalBasicSalary: string;
      totalEarnings: string;
      totalDeductionsPayroll: string;
      totalOvertime: string;
      totalBonus: string;
      totalNetSalary: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const payroll = await tx.payroll.findUnique({
        where: { id: payrollId },
      });

      if (!payroll || payroll.status !== "DRAFT") {
        throw new Error("PAYROLL_NOT_EDITABLE");
      }

      const item = await tx.payrollItem.findFirst({
        where: { id: itemId, payrollId },
      });

      if (!item) {
        throw new Error("PAYROLL_ITEM_NOT_FOUND");
      }

      await tx.payrollItem.update({
        where: { id: itemId },
        data: {
          overtimeAmount: data.overtimeAmount,
          bonusAmount: data.bonusAmount,
          otherDeduction: data.otherDeduction,
          grossSalary: data.grossSalary,
          totalDeductions: data.totalDeductions,
          netSalary: data.netSalary,
        },
      });

      return tx.payroll.update({
        where: { id: payrollId },
        data: {
          totalBasicSalary: data.totalBasicSalary,
          totalEarnings: data.totalEarnings,
          totalDeductions: data.totalDeductionsPayroll,
          totalOvertime: data.totalOvertime,
          totalBonus: data.totalBonus,
          totalNetSalary: data.totalNetSalary,
        },
        include: {
          items: {
            include: {
              employee: true,
              components: true,
            },
          },
        },
      });
    });
  },

  async changeStatus(
    id: string,
    from: "DRAFT" | "APPROVED",
    to: "APPROVED" | "PAID"
  ) {
    return prisma.$transaction(async (tx) => {
      const payroll = await tx.payroll.findUnique({ where: { id } });

      if (!payroll) throw new Error("PAYROLL_NOT_FOUND");
      if (payroll.status !== from) throw new Error("INVALID_PAYROLL_STATUS");

      return tx.payroll.update({
        where: { id },
        data: {
          status: to,
          ...(to === "APPROVED" ? { approvedAt: new Date() } : {}),
          ...(to === "PAID" ? { paidAt: new Date() } : {}),
        },
      });
    });
  },
};
