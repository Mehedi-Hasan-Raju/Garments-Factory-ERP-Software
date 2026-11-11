import { Router } from "express";
import { supplierController } from "./supplier.controller.js";
import {
  authenticate,
  requirePermission,
} from "../auth/auth.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requirePermission("suppliers.view"),
  supplierController.findAll,
);

router.get(
  "/:id",
  requirePermission("suppliers.view"),
  supplierController.findById,
);

router.post(
  "/",
  doubleCsrfProtection,
  requirePermission("suppliers.create"),
  supplierController.create,
);

router.patch(
  "/:id",
  doubleCsrfProtection,
  requirePermission("suppliers.update"),
  supplierController.update,
);

router.delete(
  "/:id",
  doubleCsrfProtection,
  requirePermission("suppliers.delete"),
  supplierController.deactivate,
);

export default router;
