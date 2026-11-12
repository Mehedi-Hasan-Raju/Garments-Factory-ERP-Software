import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";
import { employeeController } from "./employee.controller.js";
import { employeeSalaryController } from "./employee-salary.controller.js";


const router = Router();

router.get(
  "/",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"),
  employeeController.findAll
);

router.get(
  "/:id/salaries",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"),
  employeeSalaryController.findHistory
);

router.post(
  "/:id/salaries",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  employeeSalaryController.assign
);

router.get(
  "/:id",
  authenticate,
  allowRoles("OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"),
  employeeController.findById
);

router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  employeeController.create
);

router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  employeeController.update
);

router.patch(
  "/:id/status",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER", "MANAGER"),
  employeeController.updateStatus
);

router.delete(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  allowRoles("OWNER"),
  employeeController.delete
);

export default router;
