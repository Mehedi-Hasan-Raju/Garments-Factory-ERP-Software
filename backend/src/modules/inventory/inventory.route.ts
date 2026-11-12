import { Router } from "express";
import { inventoryController } from "./inventory.controller.js";

import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

const router = Router();

router.use(authenticate);

// Read operations
router.get(
  "/stock",
  allowRoles("OWNER", "ADMIN", "MANAGER", "STOREKEEPER"),
  inventoryController.findStock
);

router.get(
  "/low-stock",
  allowRoles("OWNER", "ADMIN", "MANAGER", "STOREKEEPER"),
  inventoryController.findLowStock
);

router.get(
  "/history",
  allowRoles("OWNER", "ADMIN", "MANAGER", "STOREKEEPER"),
  inventoryController.findHistory
);

// Write operations
router.post(
  "/receive",
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER", "STOREKEEPER"),
  inventoryController.receive
);

router.post(
  "/issue",
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER", "STOREKEEPER"),
  inventoryController.issue
);

router.post(
  "/transfer",
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER", "STOREKEEPER"),
  inventoryController.transfer
);

router.post(
  "/adjustment",
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER", "STOREKEEPER"),
  inventoryController.adjust
);

router.post(
  "/count",
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER", "STOREKEEPER"),
  inventoryController.count
);

export default router;
