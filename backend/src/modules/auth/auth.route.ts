import { Router } from "express";
import rateLimit from "express-rate-limit";

import { authController } from "./auth.controller.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// Public CSRF token endpoint
router.get("/csrf-token", authController.csrfToken);


router.post(
  "/login",
  loginLimiter,
  doubleCsrfProtection,
  authController.login,
);

router.post(
  "/refresh",
  doubleCsrfProtection,
  authController.refresh,
);

router.post(
  "/logout",
  doubleCsrfProtection,
  authController.logout,
);

export default router;