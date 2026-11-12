import { Router } from "express";

import { buyingHouseController } from "./buying-house.controller.js";
import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/",allowRoles("OWNER"),buyingHouseController.create);

router.get("/",allowRoles("OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"),buyingHouseController.findAll);

router.get( "/:id",allowRoles("OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"),buyingHouseController.findById);

router.patch("/:id",allowRoles("OWNER"),buyingHouseController.update);

router.patch("/:id/status",allowRoles("OWNER"), buyingHouseController.updateStatus);

export default router;