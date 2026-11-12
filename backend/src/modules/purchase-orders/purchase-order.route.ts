import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { purchaseOrderController } from "./purchase-order.controller.js";

const router = Router();

router.use(authenticate);


router.post(
  "/",
  allowRoles("OWNER"),
  purchaseOrderController.create,
);


router.get(
  "/",
  allowRoles("OWNER", "MANAGER", "ACCOUNTANT"),
  purchaseOrderController.findMany,
);


router.get(
  "/:id",
  allowRoles("OWNER", "MANAGER", "ACCOUNTANT"),
  purchaseOrderController.findById,
);


router.patch(
  "/:id",
  allowRoles("OWNER"),
  purchaseOrderController.update,
);


router.patch(
  "/:id/submit",
  allowRoles("OWNER"),
  purchaseOrderController.submit,
);


router.patch(
  "/:id/approve",
  allowRoles("OWNER"),
  purchaseOrderController.approve,
);


router.patch(
  "/:id/cancel",
  allowRoles("OWNER"),
  purchaseOrderController.cancel,
);


router.post(
  "/:id/receive",
  allowRoles("OWNER", "MANAGER", "STOREKEEPER"),
  purchaseOrderController.receive,
);

export default router;