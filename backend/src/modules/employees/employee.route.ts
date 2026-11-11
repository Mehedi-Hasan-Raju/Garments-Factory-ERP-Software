import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../auth/auth.middleware.js";
import { doubleCsrfProtection } from "../../middlewares/csrf.middleware.js";
import { employeeController } from "./employee.controller.js";
import { employeeSalaryController } from "./employee-salary.controller.js";


const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("employees.view"),
  employeeController.findAll
);

router.get(
  "/:id/salaries",
  authenticate,
  requirePermission("employees.view"),
  employeeSalaryController.findHistory
);

router.post(
  "/:id/salaries",
  authenticate,
  doubleCsrfProtection,
  requirePermission("employees.update"),
  employeeSalaryController.assign
);

router.get(
  "/:id",
  authenticate,
  requirePermission("employees.view"),
  employeeController.findById
);

router.post(
  "/",
  authenticate,
  doubleCsrfProtection,
  requirePermission("employees.create"),
  employeeController.create
);

router.patch(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("employees.update"),
  employeeController.update
);

router.patch(
  "/:id/status",
  authenticate,
  doubleCsrfProtection,
  requirePermission("employees.update"),
  employeeController.updateStatus
);

router.delete(
  "/:id",
  authenticate,
  doubleCsrfProtection,
  requirePermission("employees.delete"),
  employeeController.delete
);

export default router;
