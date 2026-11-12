import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

import { productionOrderController } from "./production-order.controller.js";

const router = Router();

router.use(authenticate);


router.post(
  "/",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  productionOrderController.create,
);

router.get(
  "/",
  allowRoles(
    "OWNER",
    "ADMIN",
    "MANAGER",
    "ACCOUNTANT",
    "STOREKEEPER",
  ),
  productionOrderController.findMany,
);


router.get(
  "/:id",
  allowRoles(
    "OWNER",
    "ADMIN",
    "MANAGER",
    "ACCOUNTANT",
    "STOREKEEPER",
  ),
  productionOrderController.findById,
);


router.patch(
  "/:id",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  productionOrderController.update,
);


router.patch(
  "/:id/progress",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  productionOrderController.updateProgress,
);


router.patch(
  "/:id/status",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  productionOrderController.updateStatus,
);

export default router;