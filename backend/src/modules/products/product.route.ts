import { Router } from "express";
import { productController } from "./product.controller.js";
import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER", "EMPLOYEE", "STOREKEEPER"),
  productController.findAll,
);

router.get(
  "/:id",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER", "EMPLOYEE", "STOREKEEPER"),
  productController.findById,
);

router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  productController.create,
);

router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  productController.update,
);

router.delete(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  productController.delete,
);

router.delete(
  "/:id/permanent",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER"),
  productController.permanentDelete,
);

export default router;
