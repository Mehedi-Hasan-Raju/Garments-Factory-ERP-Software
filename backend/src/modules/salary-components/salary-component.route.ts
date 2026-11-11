import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../auth/auth.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";
import { salaryComponentController } from "./salary-component.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("salary_components.view"),
  salaryComponentController.findAll
);

router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  requirePermission("salary_components.create"),
  salaryComponentController.create
);

router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("salary_components.update"),
  salaryComponentController.update
);

export default router;
