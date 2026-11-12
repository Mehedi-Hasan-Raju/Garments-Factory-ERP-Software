import type { Request, Response, NextFunction } from "express";
import { buyingHouseService } from "./buying-house.service.js";

import {
  createBuyingHouseSchema,
  updateBuyingHouseSchema,
  buyingHouseQuerySchema,
  buyingHouseIdSchema,
  buyingHouseStatusSchema,
} from "./buying-house.validation.js";

export const buyingHouseController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createBuyingHouseSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        });
      }

      const data = await buyingHouseService.create(parsed.data);

      return res.status(201).json({
        success: true,
        message: "Buying House created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = buyingHouseQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: parsed.error.flatten(),
        });
      }

      const result = await buyingHouseService.findAll(parsed.data);

      return res.status(200).json({
        success: true,
        message: "Buying Houses retrieved successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = buyingHouseIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid Buying House ID",
        });
      }

      const data = await buyingHouseService.findById(parsed.data.id);

      return res.status(200).json({
        success: true,
        message: "Buying House retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buyingHouseIdSchema.safeParse(req.params);
      const body = updateBuyingHouseSchema.safeParse(req.body);

      if (!params.success || !body.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: {
            params: params.success ? undefined : params.error.flatten(),
            body: body.success ? undefined : body.error.flatten(),
          },
        });
      }

      const data = await buyingHouseService.update(
        params.data.id,
        body.data
      );

      return res.status(200).json({
        success: true,
        message: "Buying House updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buyingHouseIdSchema.safeParse(req.params);
      const body = buyingHouseStatusSchema.safeParse(req.body);

      if (!params.success || !body.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
        });
      }

      const data = await buyingHouseService.updateStatus(
        params.data.id,
        body.data.isActive
      );

      return res.status(200).json({
        success: true,
        message: "Buying House status updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};