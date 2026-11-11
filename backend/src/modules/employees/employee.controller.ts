
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../lib/app-error.js";
import { employeeService } from "./employee.service.js";
import {
  createEmployeeSchema,
  employeeIdSchema,
  employeeQuerySchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
} from "./employee.validation.js";

const getValidationMessage = (error: {
  issues: { message: string }[];
}) => error.issues[0]?.message ?? "Invalid request data";

export const employeeController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createEmployeeSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError(getValidationMessage(parsed.error), 400);
      }

      const employee = await employeeService.create(parsed.data);

      res.status(201).json({
        success: true,
        message: "Employee created successfully",
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = employeeQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        throw new AppError(getValidationMessage(parsed.error), 400);
      }

      const result = await employeeService.findAll(parsed.data);

      res.status(200).json({
        success: true,
        message: "Employees retrieved successfully",
        data: result.employees,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = employeeIdSchema.safeParse(req.params);

      if (!parsed.success) {
        throw new AppError(getValidationMessage(parsed.error), 400);
      }

      const employee = await employeeService.findById(parsed.data.id);

      res.status(200).json({
        success: true,
        message: "Employee retrieved successfully",
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const idParsed = employeeIdSchema.safeParse(req.params);

      if (!idParsed.success) {
        throw new AppError(getValidationMessage(idParsed.error), 400);
      }

      const bodyParsed = updateEmployeeSchema.safeParse(req.body);

      if (!bodyParsed.success) {
        throw new AppError(getValidationMessage(bodyParsed.error), 400);
      }

      const employee = await employeeService.update(
        idParsed.data.id,
        bodyParsed.data
      );

      res.status(200).json({
        success: true,
        message: "Employee updated successfully",
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const idParsed = employeeIdSchema.safeParse(req.params);

      if (!idParsed.success) {
        throw new AppError(getValidationMessage(idParsed.error), 400);
      }

      const bodyParsed = updateEmployeeStatusSchema.safeParse(req.body);

      if (!bodyParsed.success) {
        throw new AppError(getValidationMessage(bodyParsed.error), 400);
      }

      const employee = await employeeService.updateStatus(
        idParsed.data.id,
        bodyParsed.data
      );

      res.status(200).json({
        success: true,
        message: "Employee status updated successfully",
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = employeeIdSchema.safeParse(req.params);

      if (!parsed.success) {
        throw new AppError(getValidationMessage(parsed.error), 400);
      }

      await employeeService.delete(parsed.data.id);

      res.status(200).json({
        success: true,
        message: "Employee deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
