
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../lib/app-error.js";
import { employeeSalaryService } from "./employee-salary.service.js";
import {
  assignEmployeeSalarySchema,
  employeeSalaryParamsSchema,
} from "./employee-salary.validation.js";

const message = (error: { issues: { message: string }[] }) =>
  error.issues[0]?.message ?? "Invalid request data";

export const employeeSalaryController = {
  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const params = employeeSalaryParamsSchema.safeParse(req.params);
      const body = assignEmployeeSalarySchema.safeParse(req.body);

      if (!params.success) throw new AppError(message(params.error), 400);
      if (!body.success) throw new AppError(message(body.error), 400);

      const result = await employeeSalaryService.assign(
        params.data.id,
        body.data
      );

      res.status(201).json({
        success: true,
        message: "Employee salary assigned successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async findHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const params = employeeSalaryParamsSchema.safeParse(req.params);
      if (!params.success) throw new AppError(message(params.error), 400);

      const result = await employeeSalaryService.findHistory(params.data.id);

      res.status(200).json({
        success: true,
        message: "Employee salary history retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
