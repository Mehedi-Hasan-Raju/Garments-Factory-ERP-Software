import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../lib/app-error.js";

import { purchaseOrderService } from "./purchase-order.service.js";

import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  purchaseOrderQuerySchema,
  receivePurchaseOrderSchema,
} from "./purchase-order.validation.js";

function getUserId(req: Request): string {
  const user = (req as any).user;
  const userId = user?.id ?? user?.userId;

  if (!userId) {
    throw new AppError("Authenticated user ID not found", 401);
  }

  return userId;
}

function getPurchaseOrderId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== "string") {
    throw new AppError("Invalid purchase order ID", 400);
  }

  return id;
}

export const purchaseOrderController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createPurchaseOrderSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
      }

      const data = await purchaseOrderService.create(
        parsed.data,
        getUserId(req),
      );

      res.status(201).json({
        success: true,
        message: "Purchase order created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findMany(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = purchaseOrderQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
      }

      const result = await purchaseOrderService.findMany(parsed.data);

      res.status(200).json({
        success: true,
        message: "Purchase orders retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await purchaseOrderService.findById(getPurchaseOrderId(req));

      res.status(200).json({
        success: true,
        message: "Purchase order retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updatePurchaseOrderSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
      }

      const data = await purchaseOrderService.update(
        getPurchaseOrderId(req),
        parsed.data,
      );

      res.status(200).json({
        success: true,
        message: "Purchase order updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await purchaseOrderService.submit(getPurchaseOrderId(req));

      res.status(200).json({
        success: true,
        message: "Purchase order submitted for approval",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await purchaseOrderService.approve(
        getPurchaseOrderId(req),
        getUserId(req),
      );

      res.status(200).json({
        success: true,
        message: "Purchase order approved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await purchaseOrderService.cancel(getPurchaseOrderId(req));

      res.status(200).json({
        success: true,
        message: "Purchase order cancelled successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async receive(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = receivePurchaseOrderSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
      }

      const data = await purchaseOrderService.receive(
        getPurchaseOrderId(req),
        parsed.data,
        getUserId(req),
      );

      res.status(200).json({
        success: true,
        message: "Purchase order items received and inventory updated",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};