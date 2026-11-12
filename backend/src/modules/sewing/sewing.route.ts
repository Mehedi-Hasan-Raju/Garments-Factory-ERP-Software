import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { sewingController } from "./sewing.controller.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  sewingController.create,
);

router.get(
  "/",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  sewingController.findAll,
);

router.get(
  "/production-order/:productionOrderId/summary",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  sewingController.getProductionOrderSummary,
);

router.get(
  "/:id",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  sewingController.findById,
);

router.patch(
  "/:id",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  sewingController.update,
);

export default router;