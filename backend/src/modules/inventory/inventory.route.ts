import { Router } from "express";
import { inventoryController } from "./inventory.controller.js";

import { authenticate, requirePermission } from "../auth/auth.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

const router = Router();

router.use(authenticate);

// Read operations
router.get(
  "/stock",
  requirePermission("inventory.view"),
  inventoryController.findStock
);

router.get(
  "/low-stock",
  requirePermission("inventory.view"),
  inventoryController.findLowStock
);

router.get(
  "/history",
  requirePermission("stock_history.view"),
  inventoryController.findHistory
);

// Write operations
router.post(
  "/receive",
  doubleCsrfProtection,
  requirePermission("stock_receive.create"),
  inventoryController.receive
);

router.post(
  "/issue",
  doubleCsrfProtection,
  requirePermission("stock_issue.create"),
  inventoryController.issue
);

router.post(
  "/transfer",
  doubleCsrfProtection,
  requirePermission("stock_transfer.create"),
  inventoryController.transfer
);

router.post(
  "/adjustment",
  doubleCsrfProtection,
  requirePermission("stock_adjustment.create"),
  inventoryController.adjust
);

router.post(
  "/count",
  doubleCsrfProtection,
  requirePermission("stock_count.create"),
  inventoryController.count
);

export default router;
