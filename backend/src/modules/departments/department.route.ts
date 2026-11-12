import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

import { departmentController } from "./department.controller.js";

const router = Router();


router.get(
  "/",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  departmentController.findAll,
);

router.get(
  "/:id",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER"),
  departmentController.findById,
);


router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ADMIN"),
  departmentController.create,
);


router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ADMIN"),
  departmentController.update,
);

// Activate / Deactivate department
router.patch(
  "/:id/status",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ADMIN"),
  departmentController.updateStatus,
);


router.delete(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ADMIN"),
  departmentController.delete,
);

export default router;
