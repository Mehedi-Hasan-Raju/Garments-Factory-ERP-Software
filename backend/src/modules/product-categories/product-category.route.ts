import { Router } from "express";
import { productCategoryController } from "./product-category.controller.js";
import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  allowRoles("OWNER", "MANAGER"),
  productCategoryController.findAll,
);

router.get(
  "/:id",
  authenticate,
  allowRoles("OWNER", "MANAGER"),
  productCategoryController.findById,
);

router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  productCategoryController.create,
);

router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  productCategoryController.update,
);

router.delete(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  productCategoryController.delete,
);

export default router;
