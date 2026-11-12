import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { finishedGoodsController } from "./finished-goods.controller.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  allowRoles("OWNER", "ADMIN", "MANAGER", "STOREKEEPER"),
  finishedGoodsController.create,
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
  finishedGoodsController.findAll,
);

router.get(
  "/production-order/:productionOrderId/summary",
  allowRoles(
    "OWNER",
    "ADMIN",
    "MANAGER",
    "ACCOUNTANT",
    "STOREKEEPER",
  ),
  finishedGoodsController.getProductionOrderSummary,
);

router.post(
  "/:id/movements",
  allowRoles("OWNER", "ADMIN", "MANAGER", "STOREKEEPER"),
  finishedGoodsController.createMovement,
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
  finishedGoodsController.findById,
);

export default router;