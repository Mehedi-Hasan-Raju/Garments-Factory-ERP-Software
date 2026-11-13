import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { auditLogController } from "./audit-log.controller.js";

const router = Router();
router.use(authenticate);
router.use(allowRoles("OWNER", "ADMIN"));
router.get("/", auditLogController.findAll);
router.get("/:id", auditLogController.findById);
export default router;
