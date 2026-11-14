import { AppError } from "../../lib/app-error.js";
import type { Request, Response, NextFunction } from "express";
import { inventoryService } from "./inventory.service.js";

import {
  receiveStockSchema,
  issueStockSchema,
  transferStockSchema,
  adjustmentStockSchema,
  countStockSchema,
  stockListQuerySchema,
  historyQuerySchema,
} from "./inventory.validation.js";

function getAuthenticatedUserId(req: Request): string {
  if (!req.authUser) {
    throw new AppError("Authentication required", 401);
  }

  return req.authUser.id;
}

export const inventoryController = {
  async receive(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = receiveStockSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        });
      }

      const userId = getAuthenticatedUserId(req);
      const data = await inventoryService.receive(parsed.data, userId);

      return res.status(201).json({
        success: true,
        message: "Stock received successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async issue(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = issueStockSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        });
      }

      const userId = getAuthenticatedUserId(req);
      const data = await inventoryService.issue(parsed.data, userId);

      return res.status(200).json({
        success: true,
        message: "Stock issued successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = transferStockSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        });
      }

      const userId = getAuthenticatedUserId(req);
      const data = await inventoryService.transfer(parsed.data, userId);

      return res.status(200).json({
        success: true,
        message: "Stock transferred successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async adjust(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = adjustmentStockSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        });
      }

      const userId = getAuthenticatedUserId(req);
      const data = await inventoryService.adjust(parsed.data, userId);

      return res.status(200).json({
        success: true,
        message: "Stock adjusted successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async count(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = countStockSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        });
      }

      const userId = getAuthenticatedUserId(req);
      const data = await inventoryService.count(parsed.data, userId);

      return res.status(200).json({
        success: true,
        message: "Physical stock count recorded successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findStock(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = stockListQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: parsed.error.flatten(),
        });
      }

      const data = await inventoryService.findStock(parsed.data);

      return res.status(200).json({
        success: true,
        message: "Inventory stock fetched successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findLowStock(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.findLowStock();

      return res.status(200).json({
        success: true,
        message: "Low stock fetched successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = historyQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: parsed.error.flatten(),
        });
      }

      const data = await inventoryService.findHistory(parsed.data);

      return res.status(200).json({
        success: true,
        message: "Stock history fetched successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
