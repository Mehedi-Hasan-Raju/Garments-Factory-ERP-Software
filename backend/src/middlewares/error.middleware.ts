import type { ErrorRequestHandler } from "express";
import { AppError } from "../lib/app-error.js";

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
    if (
  error &&
  typeof error === "object" &&
  "code" in error &&
  error.code === "EBADCSRFTOKEN"
) {
  res.status(403).json({
    success: false,
    message: "Invalid or missing CSRF token",
  });
  return;
}
  const isOperationalError = error instanceof AppError;

  const statusCode = isOperationalError ? error.statusCode : 500;

  const message = isOperationalError
    ? error.message
    : "Internal server error";

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};