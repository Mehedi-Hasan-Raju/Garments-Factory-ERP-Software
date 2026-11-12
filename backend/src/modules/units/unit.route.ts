import { Router } from "express";
import { unitController } from "./unit.controller.js";
import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER", "STOREKEEPER"),
  unitController.findAll,
);

router.get(
  "/:id",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER", "STOREKEEPER"),
  unitController.findById,
);

router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  unitController.create,
);

router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER", "STOREKEEPER"),
  unitController.update,
);

router.delete(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  unitController.delete,
);

export default router;
