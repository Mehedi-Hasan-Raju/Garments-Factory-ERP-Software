import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";
import { salaryComponentController } from "./salary-component.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  allowRoles("OWNER", "ACCOUNTANT"),
  salaryComponentController.findAll
);

router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ACCOUNTANT"),
  salaryComponentController.create
);

router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ACCOUNTANT"),
  salaryComponentController.update
);

export default router;
