import { Router } from "express";

import { authenticate, requirePermission } from "../auth/auth.middleware.js";
import { purchaseOrderController } from "./purchase-order.controller.js";

const router = Router();

router.use(authenticate);


router.post(
  "/",
  requirePermission("purchase_orders.create"),
  purchaseOrderController.create,
);


router.get(
  "/",
  requirePermission("purchase_orders.view"),
  purchaseOrderController.findMany,
);


router.get(
  "/:id",
  requirePermission("purchase_orders.view"),
  purchaseOrderController.findById,
);


router.patch(
  "/:id",
  requirePermission("purchase_orders.update"),
  purchaseOrderController.update,
);


router.patch(
  "/:id/submit",
  requirePermission("purchase_orders.update"),
  purchaseOrderController.submit,
);


router.patch(
  "/:id/approve",
  requirePermission("purchase_orders.approve"),
  purchaseOrderController.approve,
);


router.patch(
  "/:id/cancel",
  requirePermission("purchase_orders.update"),
  purchaseOrderController.cancel,
);


router.post(
  "/:id/receive",
  requirePermission("stock_receive.create"),
  purchaseOrderController.receive,
);

export default router;