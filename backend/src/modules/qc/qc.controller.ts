import type { Request, Response, NextFunction } from "express";
import { qcService } from "./qc.service.js";

export const qcController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.authUser) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const data = await qcService.create(req.body, req.authUser.id);

      res.status(201).json({
        success: true,
        message: "QC inspection created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await qcService.findAll(req.query);

      res.status(200).json({
        success: true,
        message: "QC inspections retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await qcService.findById({
        id: req.params.id,
      });

      res.status(200).json({
        success: true,
        message: "QC inspection retrieved successfully",
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
      const data = await qcService.getProductionOrderSummary({
        productionOrderId: req.params.productionOrderId,
      });

      res.status(200).json({
        success: true,
        message: "QC summary retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};