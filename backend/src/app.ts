
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

const app = express();

// Cookie parser
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




// Health check
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

// Global error handler
app.use(globalErrorHandler);

export default app;
