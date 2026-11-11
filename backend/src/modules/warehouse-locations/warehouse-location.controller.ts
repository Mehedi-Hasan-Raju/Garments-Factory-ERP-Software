
import type { Request, Response, NextFunction } from "express";

import { AppError } from "../../lib/app-error.js";

import { warehouseLocationService } from "./warehouse-location.service.js";

import {
  createWarehouseLocationSchema,
  updateWarehouseLocationSchema,
  warehouseLocationIdSchema,
  warehouseLocationQuerySchema,
} from "./warehouse-location.validation.js";

export const warehouseLocationController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createWarehouseLocationSchema.safeParse(
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

      const location = await warehouseLocationService.create(
        validation.data,
      );

      res.status(201).json({
        success: true,
        message: "Warehouse location created successfully",
        data: { location },
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = warehouseLocationQuerySchema.safeParse(
        req.query,
      );

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await warehouseLocationService.findAll(
        validation.data,
      );

      res.status(200).json({
        success: true,
        message: "Warehouse locations retrieved successfully",
        data: result.locations,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = warehouseLocationIdSchema.safeParse(
        req.params.id,
      );

      if (!validation.success) {
        throw new AppError("Invalid warehouse location ID", 400);
      }

      const location = await warehouseLocationService.findById(
        validation.data,
      );

      res.status(200).json({
        success: true,
        message: "Warehouse location retrieved successfully",
        data: { location },
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const idValidation = warehouseLocationIdSchema.safeParse(
        req.params.id,
      );

      if (!idValidation.success) {
        throw new AppError("Invalid warehouse location ID", 400);
      }

      const validation = updateWarehouseLocationSchema.safeParse(
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

      const location = await warehouseLocationService.update(
        idValidation.data,
        validation.data,
      );

      res.status(200).json({
        success: true,
        message: "Warehouse location updated successfully",
        data: { location },
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = warehouseLocationIdSchema.safeParse(
        req.params.id,
      );

      if (!validation.success) {
        throw new AppError("Invalid warehouse location ID", 400);
      }

      await warehouseLocationService.delete(validation.data);

      res.status(200).json({
        success: true,
        message: "Warehouse location deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
