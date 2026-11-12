import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { supplierPaymentController } from "./supplier-payment.controller.js";

const router = Router();

router.use(authenticate);


router.get(
  "/",
  allowRoles("OWNER", "ACCOUNTANT"),
  supplierPaymentController.list,
);


router.get(
  "/supplier/:supplierId/summary",
  allowRoles("OWNER", "ACCOUNTANT"),
  supplierPaymentController.getSupplierSummary,
);
 
router.post(
  "/",
  allowRoles("OWNER", "ACCOUNTANT"),
  supplierPaymentController.create,
);


router.get(
  "/:id",
  allowRoles("OWNER", "ACCOUNTANT"),
  supplierPaymentController.getById,
);


router.post(
  "/:id/allocations",
  allowRoles("OWNER", "ACCOUNTANT"),
  supplierPaymentController.allocate,
);


router.patch(
  "/:id/cancel",
  allowRoles("OWNER"),
  supplierPaymentController.cancel,
);

export default router;