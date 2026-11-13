import { AppError } from "../../lib/app-error.js";
import { shipmentRepository } from "./shipment.repository.js";
import { notifyRoles } from "../../lib/automatic-notification.js";

import type {
  CreateShipmentInput,
  CreateShipmentEventInput,
  ShipmentListQuery,
  UpdateShipmentStatusInput,
} from "./shipment.validation.js";

class ShipmentService {
  async create(
    data: CreateShipmentInput,
    createdById: string
  ) {
    const created = await shipmentRepository.create(data, createdById);
    if (!created) return created;
    await notifyRoles(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STOREKEEPER"], {
      title: "Shipment Planned",
      message: `Shipment ${created.shipmentNumber} has been planned.`,
      type: "SHIPMENT",
      actionUrl: `/shipments/${created.id}`,
    });
    return created;
  }

  async findAll(query: ShipmentListQuery) {
    return shipmentRepository.findAll(query);
  }

  async findById(id: string) {
    const shipment = await shipmentRepository.findById(id);

    if (!shipment) {
      throw new AppError("Shipment not found.", 404);
    }

    return shipment;
  }

  async findByProductionOrder(productionOrderId: string) {
    return shipmentRepository.findByProductionOrder(
      productionOrderId
    );
  }

  async updateStatus(
    id: string,
    data: UpdateShipmentStatusInput,
    createdById: string
  ) {
    const updated = await shipmentRepository.updateStatus(id, data, createdById);
    if (!updated) return updated;
    if (data.status === "DISPATCHED" || data.status === "DELIVERED" || data.status === "CANCELLED") {
      await notifyRoles(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STOREKEEPER"], {
        title: `Shipment ${data.status.charAt(0)}${data.status.slice(1).toLowerCase()}`,
        message: `Shipment ${updated.shipmentNumber} status changed to ${data.status}.`,
        type: "SHIPMENT",
        actionUrl: `/shipments/${id}`,
      });
    }
    return updated;
  }

  async createEvent(
    shipmentId: string,
    data: CreateShipmentEventInput,
    createdById: string
  ) {
    return shipmentRepository.createEvent(
      shipmentId,
      data,
      createdById
    );
  }

  async findEvents(shipmentId: string) {
    return shipmentRepository.findEvents(shipmentId);
  }
}

export const shipmentService = new ShipmentService();
