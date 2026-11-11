
import { Router } from "express";

import {
  authenticate,
  requirePermission,
} from "../auth/auth.middleware.js";

import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

import { departmentController } from "./department.controller.js";

const router = Router();

// Get all departments
router.get(
  "/",
  authenticate,
  requirePermission("departments.view"),
  departmentController.findAll,
);

// Get department by ID
router.get(
  "/:id",
  authenticate,
  requirePermission("departments.view"),
  departmentController.findById,
);

// Create department
router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  requirePermission("departments.create"),
  departmentController.create,
);

// Update department
router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("departments.update"),
  departmentController.update,
);

// Activate / Deactivate department
router.patch(
  "/:id/status",
  authenticate,
  doubleCsrfProtection,
  requirePermission("departments.update"),
  departmentController.updateStatus,
);

// Delete department
router.delete(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("departments.delete"),
  departmentController.delete,
);

export default router;
