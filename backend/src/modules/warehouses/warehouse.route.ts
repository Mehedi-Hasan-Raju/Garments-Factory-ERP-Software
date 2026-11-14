
import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

import { warehouseController } from "./warehouse.controller.js";

const router = Router();

// Get all warehouses
router.get(
  "/",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER", "STOREKEEPER"),
  warehouseController.findAll,
);

// Get warehouse by ID
router.get(
  "/:id",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER", "STOREKEEPER"),
  warehouseController.findById,
);

// Create warehouse
router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ADMIN"),
  warehouseController.create,
);

// Update warehouse
router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ADMIN","MANAGER",),
  warehouseController.update,
);

// Activate / Deactivate warehouse
router.patch(
  "/:id/status",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ADMIN"),
  warehouseController.updateStatus,
);

// Delete warehouse
router.delete(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER"),
  warehouseController.delete,
);

export default router;
