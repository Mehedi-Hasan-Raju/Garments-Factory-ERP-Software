import { Router } from "express";
import { productController } from "./product.controller.js";
import {
  authenticate,
  requirePermission,
} from "../auth/auth.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("products.view"),
  productController.findAll,
);

router.get(
  "/:id",
  authenticate,
  requirePermission("products.view"),
  productController.findById,
);

router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  requirePermission("products.create"),
  productController.create,
);

router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("products.update"),
  productController.update,
);

router.delete(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("products.delete"),
  productController.delete,
);

export default router;
