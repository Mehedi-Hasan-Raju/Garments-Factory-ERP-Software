import type { Request, Response, NextFunction } from "express";

import { productionOrderService } from "./production-order.service.js";

import {
  createProductionOrderSchema,
  updateProductionOrderSchema,
  productionOrderProgressSchema,
  productionOrderStatusSchema,
  productionOrderQuerySchema,
  productionOrderIdSchema,
} from "./production-order.validation.js";

export const productionOrderController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createProductionOrderSchema.safeParse(req.body);

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

      const data = await productionOrderService.create(
        parsed.data,
        req.authUser.id,
      );

      return res.status(201).json({
        success: true,
        message: "Production order created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findMany(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = productionOrderQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: parsed.error.flatten(),
        });
      }

      const result = await productionOrderService.findMany(parsed.data);

      return res.status(200).json({
        success: true,
        message: "Production orders retrieved successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = productionOrderIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid production order ID",
        });
      }

      const data = await productionOrderService.findById(parsed.data.id);

      return res.status(200).json({
        success: true,
        message: "Production order retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = productionOrderIdSchema.safeParse(req.params);
      const body = updateProductionOrderSchema.safeParse(req.body);

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

      if (Object.keys(body.data).length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one field is required for update",
        });
      }

      const data = await productionOrderService.update(
        params.data.id,
        body.data,
      );

      return res.status(200).json({
        success: true,
        message: "Production order updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const params = productionOrderIdSchema.safeParse(req.params);
      const body = productionOrderProgressSchema.safeParse(req.body);

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

      const data = await productionOrderService.updateProgress(
        params.data.id,
        body.data,
      );

      return res.status(200).json({
        success: true,
        message: "Production progress updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const params = productionOrderIdSchema.safeParse(req.params);
      const body = productionOrderStatusSchema.safeParse(req.body);

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

      const data = await productionOrderService.updateStatus(
        params.data.id,
        body.data,
      );

      return res.status(200).json({
        success: true,
        message: "Production order status updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};