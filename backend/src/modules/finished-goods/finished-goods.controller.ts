import type { Request, Response, NextFunction } from "express";
import { finishedGoodsService } from "./finished-goods.service.js";

export const finishedGoodsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.authUser) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const data = await finishedGoodsService.create(
        req.body,
        req.authUser.id,
      );

      res.status(201).json({
        success: true,
        message: "Finished goods received successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await finishedGoodsService.findAll(req.query);

      res.status(200).json({
        success: true,
        message: "Finished goods retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await finishedGoodsService.findById({
        id: req.params.id,
      });

      res.status(200).json({
        success: true,
        message: "Finished goods retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async createMovement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.authUser) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const data = await finishedGoodsService.createMovement(
        { id: req.params.id },
        req.body,
        req.authUser.id,
      );

      res.status(201).json({
        success: true,
        message: "Finished goods stock movement recorded successfully",
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
      const data = await finishedGoodsService.getProductionOrderSummary({
        id: req.params.productionOrderId,
      });

      res.status(200).json({
        success: true,
        message: "Finished goods summary retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};