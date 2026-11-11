
import type { Request, Response, NextFunction } from "express";
import { productCategoryService } from "./product-category.service.js";
import {
  createProductCategorySchema,
  updateProductCategorySchema,
  productCategoryIdSchema,
} from "./product-category.validation.js";

export const productCategoryController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createProductCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        });
      }

      const data = await productCategoryService.create(parsed.data);

      return res.status(201).json({
        success: true,
        message: "Product category created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await productCategoryService.findAll();

      return res.status(200).json({
        success: true,
        message: "Product categories retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = productCategoryIdSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      const data = await productCategoryService.findById(parsed.data.id);

      return res.status(200).json({
        success: true,
        message: "Product category retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = productCategoryIdSchema.safeParse(req.params);
      const body = updateProductCategorySchema.safeParse(req.body);

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

      const data = await productCategoryService.update(params.data.id, body.data);

      return res.status(200).json({
        success: true,
        message: "Product category updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = productCategoryIdSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      const data = await productCategoryService.delete(parsed.data.id);

      return res.status(200).json({
        success: true,
        message: "Product category deactivated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
