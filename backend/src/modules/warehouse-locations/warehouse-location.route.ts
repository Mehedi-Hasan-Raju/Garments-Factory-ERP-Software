
import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

import { warehouseLocationController } from "./warehouse-location.controller.js";


const router = Router();

router.get(
  "/",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER", "STOREKEEPER"),
  warehouseLocationController.findAll,
);

router.get(
  "/:id",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER", "STOREKEEPER"),
  warehouseLocationController.findById,
);

router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ADMIN"),
  warehouseLocationController.create,
);

router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ADMIN"),
  warehouseLocationController.update,
);

router.delete(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "ADMIN"),
  warehouseLocationController.delete,
);

export default router;
