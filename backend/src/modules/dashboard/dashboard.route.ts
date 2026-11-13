import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { dashboardController } from "./dashboard.controller.js";

const router = Router();

router.use(authenticate);

router.get("/overview", dashboardController.getOverview);

export default router;
