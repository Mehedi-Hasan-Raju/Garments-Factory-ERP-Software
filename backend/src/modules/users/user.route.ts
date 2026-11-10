
import { Router } from "express";

import {
  authenticate,
  requirePermission,
} from "../auth/auth.middleware.js";

import {
  doubleCsrfProtection,
} from "../../middlewares/csrf.middleware.js";

import { userController } from "./user.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  requirePermission("users.create"),
  userController.createUser,
);

export default router;
