
import { prisma } from "../../lib/prisma.js";
import type {
  CreateEmployeeInput,
  EmployeeQueryInput,
  UpdateEmployeeInput,
} from "./employee.validation.js";

export const employeeRepository = {
  create(data: CreateEmployeeInput) {
    return prisma.employee.create({
      data: {
        employeeCode: data.employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        designation: data.designation ?? null,
        employmentType: data.employmentType,
        joiningDate: data.joiningDate ?? null,
        departmentId: data.departmentId ?? null,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  },

  findAll(query: EmployeeQueryInput) {
    const { page, limit, search, status, employmentType, departmentId } =
      query;

    return prisma.employee.findMany({
      where: {
        ...(status && { status }),
        ...(employmentType && { employmentType }),
        ...(departmentId && { departmentId }),

        ...(search && {
          OR: [
            {
              employeeCode: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              firstName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              lastName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: search,
              },
            },
          ],
        }),
      },

      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            status: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      skip: (page - 1) * limit,
      take: limit,
    });
  },

  count(query: EmployeeQueryInput) {
    const { search, status, employmentType, departmentId } = query;

    return prisma.employee.count({
      where: {
        ...(status && { status }),
        ...(employmentType && { employmentType }),
        ...(departmentId && { departmentId }),

        ...(search && {
          OR: [
            {
              employeeCode: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              firstName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              lastName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: search,
              },
            },
          ],
        }),
      },
    });
  },

  findById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            status: true,
          },
        },
      },
    });
  },

  findDepartmentById(id: string) {
    return prisma.department.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
      },
    });
  },

  update(id: string, data: UpdateEmployeeInput) {
    return prisma.employee.update({
      where: { id },
      data,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  },

  updateStatus(id: string, status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED") {
    return prisma.employee.update({
      where: { id },
      data: { status },
    });
  },

  delete(id: string) {
    return prisma.employee.delete({
      where: { id },
    });
  },
};
