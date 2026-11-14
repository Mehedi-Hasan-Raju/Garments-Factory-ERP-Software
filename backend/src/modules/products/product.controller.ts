
import type { Request, Response, NextFunction } from "express";
import { productService } from "./product.service.js";
import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  productListQuerySchema,
} from "./product.validation.js";

export const productController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createProductSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        });
      }

      const data = await productService.create(parsed.data);

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = productListQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: parsed.error.flatten(),
        });
      }

      const data = await productService.findAll(parsed.data);

      return res.status(200).json({
        success: true,
        message: "Products retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = productIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const data = await productService.findById(parsed.data.id);

      return res.status(200).json({
        success: true,
        message: "Product retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = productIdSchema.safeParse(req.params);
      const body = updateProductSchema.safeParse(req.body);

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

      const data = await productService.update(params.data.id, body.data);

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = productIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const data = await productService.delete(parsed.data.id);

      return res.status(200).json({
        success: true,
        message: "Product deactivated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async permanentDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = productIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const data = await productService.permanentDelete(parsed.data.id);

      return res.status(200).json({
        success: true,
        message: "Product permanently deleted",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
