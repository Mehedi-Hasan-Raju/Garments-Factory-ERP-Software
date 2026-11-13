
import type { Request, Response } from "express";
import { AppError } from "../../lib/app-error.js";

import { shipmentService } from "./shipment.service.js";

import {
  createShipmentSchema,
  createShipmentEventSchema,
  productionOrderIdParamSchema,
  shipmentIdParamSchema,
  shipmentListQuerySchema,
  updateShipmentStatusSchema,
} from "./shipment.validation.js";

class ShipmentController {
  async create(req: Request, res: Response) {
    const parsed = createShipmentSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ??
          "Invalid shipment data.",
        400
      );
    }

    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }

    const shipment = await shipmentService.create(
      parsed.data,
      req.authUser.id
    );

    return res.status(201).json({
      success: true,
      message: "Shipment created and stock reserved successfully.",
      data: shipment,
    });
  }

  async findAll(req: Request, res: Response) {
    const parsed = shipmentListQuerySchema.safeParse(
      req.query
    );

    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ??
          "Invalid query parameters.",
        400
      );
    }

    const result = await shipmentService.findAll(
      parsed.data
    );

    return res.status(200).json({
      success: true,
      message: "Shipments retrieved successfully.",
      data: result.shipments,
      pagination: result.pagination,
    });
  }

  async findById(req: Request, res: Response) {
    const parsed = shipmentIdParamSchema.safeParse(
      req.params
    );

    if (!parsed.success) {
      throw new AppError("Invalid shipment ID.", 400);
    }

    const shipment = await shipmentService.findById(
      parsed.data.id
    );

    return res.status(200).json({
      success: true,
      message: "Shipment retrieved successfully.",
      data: shipment,
    });
  }

  async findByProductionOrder(
    req: Request,
    res: Response
  ) {
    const parsed =
      productionOrderIdParamSchema.safeParse(req.params);

    if (!parsed.success) {
      throw new AppError(
        "Invalid production order ID.",
        400
      );
    }

    const shipments =
      await shipmentService.findByProductionOrder(
        parsed.data.productionOrderId
      );

    return res.status(200).json({
      success: true,
      message: "Production order shipments retrieved successfully.",
      data: shipments,
    });
  }

  async updateStatus(req: Request, res: Response) {
    const params = shipmentIdParamSchema.safeParse(
      req.params
    );

    if (!params.success) {
      throw new AppError("Invalid shipment ID.", 400);
    }

    const body = updateShipmentStatusSchema.safeParse(
      req.body
    );

    if (!body.success) {
      throw new AppError(
        body.error.issues[0]?.message ??
          "Invalid shipment status data.",
        400
      );
    }

    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }

    const shipment = await shipmentService.updateStatus(
      params.data.id,
      body.data,
      req.authUser.id
    );

    return res.status(200).json({
      success: true,
      message: "Shipment status updated successfully.",
      data: shipment,
    });
  }

  async createEvent(req: Request, res: Response) {
    const params = shipmentIdParamSchema.safeParse(
      req.params
    );

    if (!params.success) {
      throw new AppError("Invalid shipment ID.", 400);
    }

    const body = createShipmentEventSchema.safeParse(
      req.body
    );

    if (!body.success) {
      throw new AppError(
        body.error.issues[0]?.message ??
          "Invalid shipment event data.",
        400
      );
    }

    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }

    const event = await shipmentService.createEvent(
      params.data.id,
      body.data,
      req.authUser.id
    );

    return res.status(201).json({
      success: true,
      message: "Shipment tracking event added successfully.",
      data: event,
    });
  }

  async findEvents(req: Request, res: Response) {
    const params = shipmentIdParamSchema.safeParse(
      req.params
    );

    if (!params.success) {
      throw new AppError("Invalid shipment ID.", 400);
    }

    const events = await shipmentService.findEvents(
      params.data.id
    );

    return res.status(200).json({
      success: true,
      message: "Shipment events retrieved successfully.",
      data: events,
    });
  }
}

export const shipmentController = new ShipmentController();
