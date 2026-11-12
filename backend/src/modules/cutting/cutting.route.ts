
import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

import { cuttingController } from "./cutting.controller.js";

const router = Router();

router.use(authenticate);

// Create cutting entry
router.post(
  "/",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  cuttingController.create,
);

// List cutting entries
router.get(
  "/",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  cuttingController.findMany,
);

// Cutting summary for a production order
router.get(
  "/production-order/:productionOrderId/summary",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  cuttingController.getSummary,
);

// Get single cutting entry
router.get(
  "/:id",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  cuttingController.findById,
);

// Update cutting entry
router.patch(
  "/:id",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  cuttingController.update,
);

export default router;
