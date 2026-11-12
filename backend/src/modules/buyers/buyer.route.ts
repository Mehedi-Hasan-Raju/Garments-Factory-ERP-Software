
import { Router } from "express";

import { buyerController } from "./buyer.controller.js";
import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

const router = Router();

router.use(authenticate);

// Create Buyer
router.post(
  "/",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  buyerController.create
);

// Get all Buyers
router.get(
  "/",
  allowRoles("OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"),
  buyerController.findAll
);

// Get Buyer details
router.get(
  "/:id",
  allowRoles("OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"),
  buyerController.findById
);

// Update Buyer
router.patch(
  "/:id",
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  buyerController.update
);

// Activate / Deactivate Buyer
router.patch(
  "/:id/status",
  allowRoles("OWNER", "ADMIN"),
  buyerController.updateStatus
);

export default router;
