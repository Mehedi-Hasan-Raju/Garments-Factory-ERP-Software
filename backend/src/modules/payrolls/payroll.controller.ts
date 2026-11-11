
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../lib/app-error.js";
import { payrollService } from "./payroll.service.js";
import {
  generatePayrollSchema,
  payrollIdSchema,
  payrollItemParamsSchema,
  updatePayrollAdjustmentSchema,
} from "./payroll.validation.js";

const message = (error: { issues: { message: string }[] }) =>
  error.issues[0]?.message ?? "Invalid request data";

export const payrollController = {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = generatePayrollSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(message(parsed.error), 400);
      }

      const result = await payrollService.generate(parsed.data);

      res.status(201).json({
        success: true,
        message: "Monthly payroll generated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.findAll();

      res.status(200).json({
        success: true,
        message: "Payroll records retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = payrollIdSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new AppError(message(parsed.error), 400);
      }

      const result = await payrollService.findById(parsed.data.id);

      res.status(200).json({
        success: true,
        message: "Payroll details retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateAdjustment(req: Request, res: Response, next: NextFunction) {
    try {
      const params = payrollItemParamsSchema.safeParse(req.params);
      const body = updatePayrollAdjustmentSchema.safeParse(req.body);

      if (!params.success) {
        throw new AppError(message(params.error), 400);
      }
      if (!body.success) {
        throw new AppError(message(body.error), 400);
      }

      const result = await payrollService.updateAdjustment(
        params.data.id,
        params.data.itemId,
        body.data
      );

      res.status(200).json({
        success: true,
        message: "Payroll adjustment updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = payrollIdSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new AppError(message(parsed.error), 400);
      }

      const result = await payrollService.approve(parsed.data.id);

      res.status(200).json({
        success: true,
        message: "Payroll approved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = payrollIdSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new AppError(message(parsed.error), 400);
      }

      const result = await payrollService.markPaid(parsed.data.id);

      res.status(200).json({
        success: true,
        message: "Payroll marked as paid successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
