import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../lib/app-error.js";

import { supplierPaymentService } from "./supplier-payment.service.js";

import {
  createSupplierPaymentSchema,
  allocateSupplierPaymentSchema,
  cancelSupplierPaymentSchema,
  supplierPaymentListQuerySchema,
} from "./supplier-payment.validation.js";

function getUserId(req: Request): string {
  const userId =
    (req as any).user?.id ??
    (req as any).userId;

  if (!userId) {
    throw new AppError("Authenticated user ID not found.", 401);
  }

  return userId;
}

function getRouteParam(req: Request, name: string, label: string): string {
  const value = req.params[name];

  if (typeof value !== "string") {
    throw new AppError(`Invalid ${label}.`, 400);
  }

  return value;
}

export const supplierPaymentController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createSupplierPaymentSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed.",
          errors: parsed.error.flatten(),
        });
      }

      const payment = await supplierPaymentService.create(
        parsed.data,
        getUserId(req),
      );

      return res.status(201).json({
        success: true,
        message: "Supplier payment created successfully.",
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  async allocate(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = allocateSupplierPaymentSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed.",
          errors: parsed.error.flatten(),
        });
      }

      const allocation = await supplierPaymentService.allocate(
        getRouteParam(req, "id", "supplier payment ID"),
        parsed.data,
      );

      return res.status(201).json({
        success: true,
        message: "Payment allocated to purchase order successfully.",
        data: allocation,
      });
    } catch (error) {
      next(error);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = cancelSupplierPaymentSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed.",
          errors: parsed.error.flatten(),
        });
      }

      const payment = await supplierPaymentService.cancel(
        getRouteParam(req, "id", "supplier payment ID"),
        getUserId(req),
        parsed.data.reason,
      );

      return res.status(200).json({
        success: true,
        message: "Supplier payment cancelled successfully.",
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await supplierPaymentService.getById(
        getRouteParam(req, "id", "supplier payment ID"),
      );

      return res.status(200).json({
        success: true,
        message: "Supplier payment retrieved successfully.",
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = supplierPaymentListQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters.",
          errors: parsed.error.flatten(),
        });
      }

      const result = await supplierPaymentService.list(parsed.data);

      return res.status(200).json({
        success: true,
        message: "Supplier payments retrieved successfully.",
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async getSupplierSummary(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await supplierPaymentService.getSupplierSummary(
        getRouteParam(req, "supplierId", "supplier ID"),
      );

      return res.status(200).json({
        success: true,
        message: "Supplier payment summary retrieved successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};