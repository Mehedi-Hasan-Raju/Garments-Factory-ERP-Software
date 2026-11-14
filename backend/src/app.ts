import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import cookieParser from "cookie-parser";

import { AppError } from "./lib/app-error.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import { csrfBindingMiddleware } from "./middlewares/csrf.middleware.js";

import { doubleCsrfProtection } from "./middlewares/csrf.middleware.js";
import authRoutes from "./modules/auth/auth.route.js";
import userRoutes from "./modules/users/user.route.js";
import departmentRoutes from "./modules/departments/department.route.js";
import warehouseRoutes from "./modules/warehouses/warehouse.route.js";
import warehouseLocationRoutes from "./modules/warehouse-locations/warehouse-location.route.js";
import employeeRoutes from "./modules/employees/employee.route.js";
import salaryComponentRoutes from "./modules/salary-components/salary-component.route.js";
import payrollRoutes from "./modules/payrolls/payroll.route.js";
import productCategoryRoutes from "./modules/product-categories/product-category.route.js";
import unitRoutes from "./modules/units/unit.route.js";
import productRoutes from "./modules/products/product.route.js";
import inventoryRoutes from "./modules/inventory/inventory.route.js";
import supplierRoutes from "./modules/suppliers/supplier.route.js";
import purchaseOrderRoutes from "./modules/purchase-orders/purchase-order.route.js";
import buyingHouseRoutes from "./modules/buying-houses/buying-house.route.js";
import buyerRoutes from "./modules/buyers/buyer.route.js";
import productionOrderRoutes from "./modules/production-orders/production-order.route.js";
import cuttingRoutes from "./modules/cutting/cutting.route.js";
import sewingRoutes from "./modules/sewing/sewing.route.js";
import qcRoutes from "./modules/qc/qc.route.js";
import finishedGoodsRoutes from "./modules/finished-goods/finished-goods.route.js";
import shipmentRoutes from "./modules/shipments/shipment.route.js";
import notificationRoutes from "./modules/notifications/notification.route.js";
import dashboardRoutes from "./modules/dashboard/dashboard.route.js";
import auditLogRoutes from "./modules/audit-logs/audit-log.route.js";

const app = express();
 

app.use(cookieParser());
app.use(csrfBindingMiddleware);


app.use(helmet());


app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
    ],
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
app.use("/api/v1/warehouse-locations", warehouseLocationRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/salary-components", salaryComponentRoutes);
app.use("/api/v1/payrolls", payrollRoutes);
app.use("/api/v1/product-categories", productCategoryRoutes);
app.use("/api/v1/units", unitRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/suppliers", supplierRoutes);

// CSRF Protected Modules
app.use("/api/v1/purchase-orders", doubleCsrfProtection, purchaseOrderRoutes);
app.use("/api/v1/buying-houses", doubleCsrfProtection, buyingHouseRoutes);
app.use("/api/v1/buyers", doubleCsrfProtection, buyerRoutes);
app.use("/api/v1/production-orders", doubleCsrfProtection, productionOrderRoutes);
app.use("/api/v1/cutting", doubleCsrfProtection, cuttingRoutes);
app.use("/api/v1/sewing", doubleCsrfProtection, sewingRoutes);
app.use("/api/v1/qc", doubleCsrfProtection, qcRoutes);
app.use("/api/v1/finished-goods", doubleCsrfProtection, finishedGoodsRoutes);
app.use("/api/v1/shipments", doubleCsrfProtection, shipmentRoutes);
app.use("/api/v1/notifications", doubleCsrfProtection, notificationRoutes);

app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/audit-logs", auditLogRoutes);




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
