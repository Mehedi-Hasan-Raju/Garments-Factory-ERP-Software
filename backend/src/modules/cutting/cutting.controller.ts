
import type { Request, Response, NextFunction } from "express";

import { cuttingService } from "./cutting.service.js";

import {
  createCuttingSchema,
  updateCuttingSchema,
  cuttingQuerySchema,
  cuttingIdSchema,
} from "./cutting.validation.js";

export const cuttingController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createCuttingSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        });
      }

      if (!req.authUser) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const data = await cuttingService.create(
        parsed.data,
        req.authUser.id,
      );

      return res.status(201).json({
        success: true,
        message: "Cutting entry created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findMany(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = cuttingQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: parsed.error.flatten(),
        });
      }

      const result = await cuttingService.findMany(parsed.data);

      return res.status(200).json({
        success: true,
        message: "Cutting entries retrieved successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = cuttingIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid cutting entry ID",
        });
      }

      const data = await cuttingService.findById(parsed.data.id);

      return res.status(200).json({
        success: true,
        message: "Cutting entry retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = cuttingIdSchema.safeParse(req.params);
      const body = updateCuttingSchema.safeParse(req.body);

      if (!params.success || !body.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: {
            params: params.success
              ? undefined
              : params.error.flatten(),
            body: body.success
              ? undefined
              : body.error.flatten(),
          },
        });
      }

      const data = await cuttingService.update(
        params.data.id,
        body.data,
      );

      return res.status(200).json({
        success: true,
        message: "Cutting entry updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = cuttingIdSchema.safeParse({
        id: req.params.productionOrderId,
      });

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid production order ID",
        });
      }

      const data = await cuttingService.getSummary(parsed.data.id);

      return res.status(200).json({
        success: true,
        message: "Cutting summary retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
