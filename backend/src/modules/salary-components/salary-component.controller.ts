
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../lib/app-error.js";
import { salaryComponentService } from "./salary-component.service.js";
import {
  createSalaryComponentSchema,
  salaryComponentIdSchema,
  updateSalaryComponentSchema,
} from "./salary-component.validation.js";

const validationMessage = (error: { issues: { message: string }[] }) =>
  error.issues[0]?.message ?? "Invalid request data";

export const salaryComponentController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createSalaryComponentSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(validationMessage(parsed.error), 400);
      }

      const result = await salaryComponentService.create(parsed.data);

      res.status(201).json({
        success: true,
        message: "Salary component created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await salaryComponentService.findAll();

      res.status(200).json({
        success: true,
        message: "Salary components retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = salaryComponentIdSchema.safeParse(req.params);
      const body = updateSalaryComponentSchema.safeParse(req.body);

      if (!id.success) {
        throw new AppError(validationMessage(id.error), 400);
      }
      if (!body.success) {
        throw new AppError(validationMessage(body.error), 400);
      }

      const result = await salaryComponentService.update(
        id.data.id,
        body.data
      );

      res.status(200).json({
        success: true,
        message: "Salary component updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
