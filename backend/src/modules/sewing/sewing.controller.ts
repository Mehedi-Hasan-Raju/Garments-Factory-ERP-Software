import type { Request, Response, NextFunction } from "express";
import { sewingService } from "./sewing.service.js";

export const sewingController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.authUser) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const data = await sewingService.create(
        req.body,
        req.authUser.id,
      );

      res.status(201).json({
        success: true,
        message: "Sewing entry created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await sewingService.findAll(req.query);

      res.status(200).json({
        success: true,
        message: "Sewing entries retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await sewingService.findById({
        id: req.params.id,
      });

      res.status(200).json({
        success: true,
        message: "Sewing entry retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await sewingService.update(
        { id: req.params.id },
        req.body,
      );

      res.status(200).json({
        success: true,
        message: "Sewing entry updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async getProductionOrderSummary(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = await sewingService.getProductionOrderSummary({
        productionOrderId: req.params.productionOrderId,
      });

      res.status(200).json({
        success: true,
        message: "Sewing summary retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};