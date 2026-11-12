import { Router } from "express";

import { authenticate, requirePermission } from "../auth/auth.middleware.js";
import { supplierPaymentController } from "./supplier-payment.controller.js";

const router = Router();

router.use(authenticate);


router.get(
  "/",
  requirePermission("supplier_payments.view"),
  supplierPaymentController.list,
);


router.get(
  "/supplier/:supplierId/summary",
  requirePermission("supplier_payments.view"),
  supplierPaymentController.getSupplierSummary,
);
 
router.post(
  "/",
  requirePermission("supplier_payments.create"),
  supplierPaymentController.create,
);


router.get(
  "/:id",
  requirePermission("supplier_payments.view"),
  supplierPaymentController.getById,
);


router.post(
  "/:id/allocations",
  requirePermission("supplier_payments.create"),
  supplierPaymentController.allocate,
);


router.patch(
  "/:id/cancel",
  requirePermission("supplier_payments.cancel"),
  supplierPaymentController.cancel,
);

export default router;