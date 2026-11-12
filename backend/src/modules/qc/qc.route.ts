import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { qcController } from "./qc.controller.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  qcController.create,
);

router.get(
  "/",
  allowRoles("OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"),
  qcController.findAll,
);

router.get(
  "/production-order/:productionOrderId/summary",
  allowRoles("OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"),
  qcController.getProductionOrderSummary,
);

router.get(
  "/:id",
  allowRoles("OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"),
  qcController.findById,
);

export default router;