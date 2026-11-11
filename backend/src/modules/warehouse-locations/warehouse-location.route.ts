
import { Router } from "express";

import {
  authenticate,
  requirePermission,
} from "../auth/auth.middleware.js";

import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

import { warehouseLocationController } from "./warehouse-location.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("warehouse_locations.view"),
  warehouseLocationController.findAll,
);

router.get(
  "/:id",
  authenticate,
  requirePermission("warehouse_locations.view"),
  warehouseLocationController.findById,
);

router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  requirePermission("warehouse_locations.create"),
  warehouseLocationController.create,
);

router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("warehouse_locations.update"),
  warehouseLocationController.update,
);

router.delete(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("warehouse_locations.delete"),
  warehouseLocationController.delete,
);

export default router;
