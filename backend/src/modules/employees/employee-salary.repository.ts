
import { prisma } from "../../lib/prisma.js";
import type { AssignEmployeeSalaryInput } from "./employee-salary.validation.js";

export const employeeSalaryRepository = {
  findEmployee(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });
  },

  findHistory(employeeId: string) {
    return prisma.employeeSalary.findMany({
      where: { employeeId },
      include: {
        components: {
          include: {
            component: true,
          },
        },
      },
      orderBy: { effectiveFrom: "desc" },
    });
  },

  async assign(employeeId: string, data: AssignEmployeeSalaryInput) {
    return prisma.$transaction(async (tx) => {
      const effectiveFrom = new Date(data.effectiveFrom);
      effectiveFrom.setUTCHours(0, 0, 0, 0);

      const previousRecords = await tx.employeeSalary.findMany({
        where: {
          employeeId,
          effectiveFrom: { lt: effectiveFrom },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: effectiveFrom } },
          ],
        },
      });

      const futureRecord = await tx.employeeSalary.findFirst({
        where: {
          employeeId,
          effectiveFrom: { gte: effectiveFrom },
        },
      });

      if (futureRecord) {
        throw new Error("FUTURE_SALARY_RECORD_EXISTS");
      }

      const componentIds = data.components.map((item) => item.componentId);

      const components = await tx.salaryComponent.findMany({
        where: {
          id: { in: componentIds },
          isActive: true,
        },
      });

      if (components.length !== new Set(componentIds).size) {
        throw new Error("INVALID_SALARY_COMPONENT");
      }

      for (const previous of previousRecords) {
        const endDate = new Date(effectiveFrom);
        endDate.setUTCDate(endDate.getUTCDate() - 1);

        await tx.employeeSalary.update({
          where: { id: previous.id },
          data: { effectiveTo: endDate },
        });
      }

      return tx.employeeSalary.create({
        data: {
          employeeId,
          basicSalary: data.basicSalary,
          effectiveFrom,
          note: data.note ?? null,
          components: {
            create: data.components.map((item) => ({
              componentId: item.componentId,
              amount: item.amount,
            })),
          },
        },
        include: {
          components: {
            include: { component: true },
          },
        },
      });
    });
  },
};
