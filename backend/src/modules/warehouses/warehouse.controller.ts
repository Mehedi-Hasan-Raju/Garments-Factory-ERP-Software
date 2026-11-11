
import type { Request, Response, NextFunction } from "express";

import { AppError } from "../../lib/app-error.js";

import { warehouseService } from "./warehouse.service.js";

import {
  createWarehouseSchema,
  updateWarehouseSchema,
  updateWarehouseStatusSchema,
  warehouseIdSchema,
  warehouseQuerySchema,
} from "./warehouse.validation.js";

export const warehouseController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createWarehouseSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const warehouse = await warehouseService.create(validation.data);

      res.status(201).json({
        success: true,
        message: "Warehouse created successfully",
        data: { warehouse },
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = warehouseQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await warehouseService.findAll(validation.data);

      res.status(200).json({
        success: true,
        message: "Warehouses retrieved successfully",
        data: result.warehouses,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = warehouseIdSchema.safeParse(req.params.id);

      if (!validation.success) {
        throw new AppError("Invalid warehouse ID", 400);
      }

      const warehouse = await warehouseService.findById(
        validation.data,
      );

      res.status(200).json({
        success: true,
        message: "Warehouse retrieved successfully",
        data: { warehouse },
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const idValidation = warehouseIdSchema.safeParse(req.params.id);

      if (!idValidation.success) {
        throw new AppError("Invalid warehouse ID", 400);
      }

      const validation = updateWarehouseSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const warehouse = await warehouseService.update(
        idValidation.data,
        validation.data,
      );

      res.status(200).json({
        success: true,
        message: "Warehouse updated successfully",
        data: { warehouse },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const idValidation = warehouseIdSchema.safeParse(req.params.id);

      if (!idValidation.success) {
        throw new AppError("Invalid warehouse ID", 400);
      }

      const validation = updateWarehouseStatusSchema.safeParse(
        req.body,
      );

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const warehouse = await warehouseService.updateStatus(
        idValidation.data,
        validation.data.isActive,
      );

      res.status(200).json({
        success: true,
        message: `Warehouse ${validation.data.isActive ? "activated" : "deactivated"} successfully`,
        data: { warehouse },
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = warehouseIdSchema.safeParse(req.params.id);

      if (!validation.success) {
        throw new AppError("Invalid warehouse ID", 400);
      }

      await warehouseService.delete(validation.data);

      res.status(200).json({
        success: true,
        message: "Warehouse deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
