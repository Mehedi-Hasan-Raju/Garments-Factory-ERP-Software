
import type { Request, Response, NextFunction } from "express";

import { buyerService } from "./buyer.service.js";

import {
  createBuyerSchema,
  updateBuyerSchema,
  buyerQuerySchema,
  buyerIdSchema,
  buyerStatusSchema,
} from "./buyer.validation.js";

export const buyerController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createBuyerSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        });
      }

      const data = await buyerService.create(parsed.data);

      return res.status(201).json({
        success: true,
        message: "Buyer created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = buyerQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: parsed.error.flatten(),
        });
      }

      const result = await buyerService.findAll(parsed.data);

      return res.status(200).json({
        success: true,
        message: "Buyers retrieved successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = buyerIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid Buyer ID",
        });
      }

      const data = await buyerService.findById(parsed.data.id);

      return res.status(200).json({
        success: true,
        message: "Buyer retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buyerIdSchema.safeParse(req.params);
      const body = updateBuyerSchema.safeParse(req.body);

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

      const data = await buyerService.update(
        params.data.id,
        body.data
      );

      return res.status(200).json({
        success: true,
        message: "Buyer updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const params = buyerIdSchema.safeParse(req.params);
      const body = buyerStatusSchema.safeParse(req.body);

      if (!params.success || !body.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
        });
      }

      const data = await buyerService.updateStatus(
        params.data.id,
        body.data.isActive
      );

      return res.status(200).json({
        success: true,
        message: "Buyer status updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
