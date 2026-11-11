import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import cookieParser from "cookie-parser";

import { AppError } from "./lib/app-error.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import { csrfBindingMiddleware } from "./middlewares/csrf.middleware.js";


import authRoutes from "./modules/auth/auth.route.js";
import userRoutes from "./modules/users/user.route.js";
import departmentRoutes from "./modules/departments/department.route.js";
import warehouseRoutes from "./modules/warehouses/warehouse.route.js";
import warehouseLocationRoutes from "./modules/warehouse-locations/warehouse-location.route.js";
import employeeRoutes from "./modules/employees/employee.route.js";
import salaryComponentRoutes from "./modules/salary-components/salary-component.route.js";
import payrollRoutes from "./modules/payrolls/payroll.route.js";
import productCategoryRoutes from "./modules/product-categories/product-category.route.js";


const app = express();
 

app.use(cookieParser());
app.use(csrfBindingMiddleware);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Request parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(
  pinoHttp({
    redact: {
      paths: [
        "req.headers.cookie",
        "req.headers.authorization",
        'res.headers["set-cookie"]',
        "req.body.password",
        "req.body.passwordHash",
        "req.body.refreshToken",
        "req.body.accessToken",
        "req.headers.x-csrf-token",
      ],
      censor: "[REDACTED]",
    },
  }),
);


const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});



app.use("/api", apiLimiter);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/warehouses", warehouseRoutes);
app.use("/api/v1/warehouse-locations",warehouseLocationRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/salary-components", salaryComponentRoutes);
app.use("/api/v1/payrolls", payrollRoutes);
app.use("/api/v1/product-categories", productCategoryRoutes);

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Garments ERP API is running",
    timestamp: new Date().toISOString(),
  });
});


app.use((_req, _res, next) => {
  next(new AppError("API endpoint not found", 404));
});


app.use(globalErrorHandler);

export default app;
