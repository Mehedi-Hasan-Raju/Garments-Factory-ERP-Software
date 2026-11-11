import { Router } from "express";
import { unitController } from "./unit.controller.js";
import {
  authenticate,
  requirePermission,
} from "../auth/auth.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("units.view"),
  unitController.findAll,
);

router.get(
  "/:id",
  authenticate,
  requirePermission("units.view"),
  unitController.findById,
);

router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  requirePermission("units.create"),
  unitController.create,
);

router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("units.update"),
  unitController.update,
);

router.delete(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("units.delete"),
  unitController.delete,
);

export default router;
