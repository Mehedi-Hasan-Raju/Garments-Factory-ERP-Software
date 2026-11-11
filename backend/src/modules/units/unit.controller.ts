import type { Request, Response, NextFunction } from "express";
import { unitService } from "./unit.service.js";
import {
  createUnitSchema,
  updateUnitSchema,
  unitIdSchema,
} from "./unit.validation.js";

export const unitController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createUnitSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        });
      }

      const data = await unitService.create(parsed.data);

      return res.status(201).json({
        success: true,
        message: "Unit created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await unitService.findAll();

      return res.status(200).json({
        success: true,
        message: "Units retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = unitIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid unit ID",
        });
      }

      const data = await unitService.findById(parsed.data.id);

      return res.status(200).json({
        success: true,
        message: "Unit retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = unitIdSchema.safeParse(req.params);
      const body = updateUnitSchema.safeParse(req.body);

      if (!params.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: params.error.flatten(),
        });
      }

      if (!body.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: body.error.flatten(),
        });
      }

      const data = await unitService.update(params.data.id, body.data);

      return res.status(200).json({
        success: true,
        message: "Unit updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = unitIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid unit ID",
        });
      }

      const data = await unitService.delete(parsed.data.id);

      return res.status(200).json({
        success: true,
        message: "Unit deactivated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
