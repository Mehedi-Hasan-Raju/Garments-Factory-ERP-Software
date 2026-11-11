
import type { Request, Response, NextFunction } from "express";
import { supplierService } from "./supplier.service.js";
import {
  createSupplierSchema,
  supplierIdSchema,
  supplierQuerySchema,
  updateSupplierSchema,
} from "./supplier.validation.js";

export const supplierController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createSupplierSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        });
        return;
      }

      const supplier = await supplierService.create(parsed.data);

      res.status(201).json({
        success: true,
        message: "Supplier created successfully",
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = supplierQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: parsed.error.flatten(),
        });
        return;
      }

      const result = await supplierService.findAll(parsed.data);

      res.status(200).json({
        success: true,
        message: "Suppliers retrieved successfully",
        data: result.suppliers,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = supplierIdSchema.safeParse(req.params);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: "Invalid supplier ID",
          errors: parsed.error.flatten(),
        });
        return;
      }

      const supplier = await supplierService.findById(parsed.data.id);

      res.status(200).json({
        success: true,
        message: "Supplier retrieved successfully",
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = supplierIdSchema.safeParse(req.params);
      const body = updateSupplierSchema.safeParse(req.body);

      if (!params.success || !body.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: {
            params: params.success ? undefined : params.error.flatten(),
            body: body.success ? undefined : body.error.flatten(),
          },
        });
        return;
      }

      const supplier = await supplierService.update(
        params.data.id,
        body.data,
      );

      res.status(200).json({
        success: true,
        message: "Supplier updated successfully",
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  },

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = supplierIdSchema.safeParse(req.params);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: "Invalid supplier ID",
          errors: parsed.error.flatten(),
        });
        return;
      }

      const supplier = await supplierService.deactivate(parsed.data.id);

      res.status(200).json({
        success: true,
        message: "Supplier deactivated successfully",
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  },
};
