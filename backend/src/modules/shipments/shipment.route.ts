
import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

import { shipmentController } from "./shipment.controller.js";

const router = Router();

// Create shipment and reserve finished goods
router.post(
  "/",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER", "STOREKEEPER"),
  shipmentController.create
);

// List shipments
router.get(
  "/",
  authenticate,
  allowRoles(
    "OWNER",
    "ADMIN",
    "MANAGER",
    "ACCOUNTANT",
    "STOREKEEPER"
  ),
  shipmentController.findAll
);

// Get shipments by production order
router.get(
  "/production-order/:productionOrderId",
  authenticate,
  allowRoles(
    "OWNER",
    "ADMIN",
    "MANAGER",
    "ACCOUNTANT",
    "STOREKEEPER"
  ),
  shipmentController.findByProductionOrder
);

// Update shipment status
router.patch(
  "/:id/status",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER", "STOREKEEPER"),
  shipmentController.updateStatus
);

// Add tracking event
router.post(
  "/:id/events",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER", "STOREKEEPER"),
  shipmentController.createEvent
);

// Get tracking events
router.get(
  "/:id/events",
  authenticate,
  allowRoles(
    "OWNER",
    "ADMIN",
    "MANAGER",
    "ACCOUNTANT",
    "STOREKEEPER"
  ),
  shipmentController.findEvents
);

// Get shipment details
router.get(
  "/:id",
  authenticate,
  allowRoles(
    "OWNER",
    "ADMIN",
    "MANAGER",
    "ACCOUNTANT",
    "STOREKEEPER"
  ),
  shipmentController.findById
);

export default router;
