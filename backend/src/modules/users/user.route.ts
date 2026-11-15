import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js";

import { allowRoles } from "../../middlewares/role.middleware.js";

import {
  doubleCsrfProtection,
} from "../../middlewares/csrf.middleware.js";

import { userController } from "./user.controller.js";

const router = Router();

// Get all user accounts
router.get(
  "/",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  userController.findAll,
);

// Create user account
router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  userController.createUser,
);

export default router;