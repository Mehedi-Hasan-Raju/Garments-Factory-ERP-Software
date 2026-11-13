
import { AppError } from "../../lib/app-error.js";
import { employeeRepository } from "./employee.repository.js";
import { notifyRoles } from "../../lib/automatic-notification.js";
import type {
  CreateEmployeeInput,
  EmployeeQueryInput,
  UpdateEmployeeInput,
  UpdateEmployeeStatusInput,
} from "./employee.validation.js";

const isPrismaError = (error: unknown, code: string) => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
};

const validateDepartment = async (departmentId?: string | null) => {
  if (!departmentId) return;

  const department =
    await employeeRepository.findDepartmentById(departmentId);

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  if (!department.isActive) {
    throw new AppError("Cannot assign employee to an inactive department", 409);
  }
};

export const employeeService = {
  async create(data: CreateEmployeeInput) {
    await validateDepartment(data.departmentId);

    try {
      const created = await employeeRepository.create(data);
      await notifyRoles(["OWNER", "ADMIN", "MANAGER"], {
        title: "New Employee Created",
        message: `Employee ${created.employeeCode} has been added to the organization.`,
        type: "HR",
        actionUrl: `/employees/${created.id}`,
      });
      return created;
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        throw new AppError(
          "Employee code, email or phone already exists",
          409
        );
      }

      if (isPrismaError(error, "P2003")) {
        throw new AppError("Invalid department reference", 400);
      }

      throw error;
    }
  },

  async findAll(query: EmployeeQueryInput) {
    const [employees, total] = await Promise.all([
      employeeRepository.findAll(query),
      employeeRepository.count(query),
    ]);

    return {
      employees,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async findById(id: string) {
    const employee = await employeeRepository.findById(id);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    return employee;
  },

  async update(id: string, data: UpdateEmployeeInput) {
    await this.findById(id);

    if (data.departmentId !== undefined) {
      await validateDepartment(data.departmentId);
    }

    try {
      return await employeeRepository.update(id, data);
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        throw new AppError(
          "Employee code, email or phone already exists",
          409
        );
      }

      if (isPrismaError(error, "P2003")) {
        throw new AppError("Invalid department reference", 400);
      }

      throw error;
    }
  },

  async updateStatus(id: string, data: UpdateEmployeeStatusInput) {
    await this.findById(id);

    const updated = await employeeRepository.updateStatus(id, data.status);
    await notifyRoles(["OWNER", "ADMIN", "MANAGER"], {
      title: "Employee Status Updated",
      message: `Employee ${updated.employeeCode} status changed to ${data.status}.`,
      type: "HR",
      actionUrl: `/employees/${id}`,
    });
    return updated;
  },

  async delete(id: string) {
    const employee = await this.findById(id);

    if (employee.user) {
      throw new AppError(
        "This employee has a linked user account. Unlink the account before deleting the employee.",
        409
      );
    }

    return employeeRepository.delete(id);
  },
};
