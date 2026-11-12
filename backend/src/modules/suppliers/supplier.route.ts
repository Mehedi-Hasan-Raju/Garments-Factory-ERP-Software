import { Router } from "express";
import { supplierController } from "./supplier.controller.js";
import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  allowRoles("OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"),
  supplierController.findAll,
);

router.get(
  "/:id",
  allowRoles("OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"),
  supplierController.findById,
);

router.post(
  "/",
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  supplierController.create,
);

router.patch(
  "/:id",
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  supplierController.update,
);

router.delete(
  "/:id",
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  supplierController.deactivate,
);

export default router;
