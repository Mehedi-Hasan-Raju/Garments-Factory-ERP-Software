import { Router } from "express";
import { productCategoryController } from "./product-category.controller.js";
import { authenticate, requirePermission } from "../auth/auth.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("product_categories.view"),
  productCategoryController.findAll,
);

router.get(
  "/:id",
  authenticate,
  requirePermission("product_categories.view"),
  productCategoryController.findById,
);

router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  requirePermission("product_categories.create"),
  productCategoryController.create,
);

router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("product_categories.update"),
  productCategoryController.update,
);

router.delete(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("product_categories.delete"),
  productCategoryController.delete,
);

export default router;
