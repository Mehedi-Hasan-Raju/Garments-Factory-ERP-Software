
import { AppError } from "../../lib/app-error.js";
import { employeeSalaryRepository } from "./employee-salary.repository.js";
import type { AssignEmployeeSalaryInput } from "./employee-salary.validation.js";

export const employeeSalaryService = {
  async findHistory(employeeId: string) {
    const employee = await employeeSalaryRepository.findEmployee(employeeId);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    return employeeSalaryRepository.findHistory(employeeId);
  },

  async assign(employeeId: string, data: AssignEmployeeSalaryInput) {
    const employee = await employeeSalaryRepository.findEmployee(employeeId);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    if (employee.status === "TERMINATED") {
      throw new AppError("Cannot assign salary to a terminated employee", 409);
    }

    try {
      return await employeeSalaryRepository.assign(employeeId, data);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "FUTURE_SALARY_RECORD_EXISTS") {
          throw new AppError(
            "A future salary record already exists. Choose a date before that record or revise it first.",
            409
          );
        }

        if (error.message === "INVALID_SALARY_COMPONENT") {
          throw new AppError(
            "One or more salary components are invalid or inactive",
            400
          );
        }
      }

      throw error;
    }
  },
};
