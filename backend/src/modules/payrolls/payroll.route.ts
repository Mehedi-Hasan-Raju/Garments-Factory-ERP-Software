
import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";
import { payrollController } from "./payroll.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  allowRoles("OWNER", "ACCOUNTANT"),
  payrollController.findAll
);

router.get(
  "/:id",
  authenticate,
  allowRoles("OWNER", "ACCOUNTANT"),
  payrollController.findById
);

router.post(
  "/generate",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ACCOUNTANT"),
  payrollController.generate
);

router.patch(
  "/:id/items/:itemId/adjustments",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ACCOUNTANT"),
  payrollController.updateAdjustment
);

router.patch(
  "/:id/approve",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ACCOUNTANT"),
  payrollController.approve
);

router.patch(
  "/:id/pay",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ACCOUNTANT"),
  payrollController.markPaid
);

export default router;
