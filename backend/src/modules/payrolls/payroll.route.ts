
import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../auth/auth.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";
import { payrollController } from "./payroll.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("payrolls.view"),
  payrollController.findAll
);

router.get(
  "/:id",
  authenticate,
  requirePermission("payrolls.view"),
  payrollController.findById
);

router.post(
  "/generate",
  authenticate,
  doubleCsrfProtection,
  requirePermission("payrolls.create"),
  payrollController.generate
);

router.patch(
  "/:id/items/:itemId/adjustments",
  authenticate,
  doubleCsrfProtection,
  requirePermission("payrolls.update"),
  payrollController.updateAdjustment
);

router.patch(
  "/:id/approve",
  authenticate,
  doubleCsrfProtection,
  requirePermission("payrolls.approve"),
  payrollController.approve
);

router.patch(
  "/:id/pay",
  authenticate,
  doubleCsrfProtection,
  requirePermission("payrolls.pay"),
  payrollController.markPaid
);

export default router;
