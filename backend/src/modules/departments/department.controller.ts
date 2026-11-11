
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../lib/app-error.js";

import { departmentService } from "./department.service.js";

import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentStatusSchema,
  departmentIdSchema,
  departmentQuerySchema,
} from "./department.validation.js";

export const departmentController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createDepartmentSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const department = await departmentService.create(validation.data);

      res.status(201).json({
        success: true,
        message: "Department created successfully",
        data: { department },
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = departmentQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await departmentService.findAll(validation.data);

      res.status(200).json({
        success: true,
        message: "Departments retrieved successfully",
        data: result.departments,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const idValidation = departmentIdSchema.safeParse(req.params.id);

      if (!idValidation.success) {
        throw new AppError("Invalid department ID", 400);
      }

      const department = await departmentService.findById(
        idValidation.data,
      );

      res.status(200).json({
        success: true,
        message: "Department retrieved successfully",
        data: { department },
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const idValidation = departmentIdSchema.safeParse(req.params.id);

      if (!idValidation.success) {
        throw new AppError("Invalid department ID", 400);
      }

      const validation = updateDepartmentSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const department = await departmentService.update(
        idValidation.data,
        validation.data,
      );

      res.status(200).json({
        success: true,
        message: "Department updated successfully",
        data: { department },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const idValidation = departmentIdSchema.safeParse(req.params.id);

      if (!idValidation.success) {
        throw new AppError("Invalid department ID", 400);
      }

      const validation = departmentStatusSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const department = await departmentService.updateStatus(
        idValidation.data,
        validation.data.isActive,
      );

      res.status(200).json({
        success: true,
        message: `Department ${validation.data.isActive ? "activated" : "deactivated"} successfully`,
        data: { department },
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const idValidation = departmentIdSchema.safeParse(req.params.id);

      if (!idValidation.success) {
        throw new AppError("Invalid department ID", 400);
      }

      await departmentService.delete(idValidation.data);

      res.status(200).json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
