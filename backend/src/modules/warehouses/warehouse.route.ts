
import { Router } from "express";

import {
  authenticate,
  requirePermission,
} from "../auth/auth.middleware.js";

import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

import { warehouseController } from "./warehouse.controller.js";

const router = Router();

// Get all warehouses
router.get(
  "/",
  authenticate,
  requirePermission("warehouses.view"),
  warehouseController.findAll,
);

// Get warehouse by ID
router.get(
  "/:id",
  authenticate,
  requirePermission("warehouses.view"),
  warehouseController.findById,
);

// Create warehouse
router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  requirePermission("warehouses.create"),
  warehouseController.create,
);

// Update warehouse
router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("warehouses.update"),
  warehouseController.update,
);

// Activate / Deactivate warehouse
router.patch(
  "/:id/status",
  authenticate,
  doubleCsrfProtection,
  requirePermission("warehouses.update"),
  warehouseController.updateStatus,
);

// Delete warehouse
router.delete(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("warehouses.delete"),
  warehouseController.delete,
);

export default router;
