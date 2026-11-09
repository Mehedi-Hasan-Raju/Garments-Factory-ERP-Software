import type { RequestHandler } from "express";
import { randomBytes } from "node:crypto";
import { doubleCsrf } from "csrf-csrf";

const isProduction = process.env.NODE_ENV === "production";

const csrfSecret = process.env.CSRF_SECRET;

if (!csrfSecret || Buffer.byteLength(csrfSecret, "utf8") < 32) {
  throw new Error("CSRF_SECRET must contain at least 32 bytes");
}

const configuredSameSite = (
  process.env.COOKIE_SAME_SITE || "lax"
).toLowerCase();

if (!["strict", "lax", "none"].includes(configuredSameSite)) {
  throw new Error("Invalid COOKIE_SAME_SITE configuration");
}

const sameSite = configuredSameSite as
  "strict" | "lax" | "none";

const secure =
  isProduction || process.env.COOKIE_SECURE === "true";

if (sameSite === "none" && !secure) {
  throw new Error("SameSite=None requires Secure cookies");
}

// Use __Host- prefix in production.
// Development uses normal cookie names because localhost uses HTTP.
const csrfCookieName = isProduction
  ? "__Host-garments-csrf"
  : "garments-csrf";

const csrfBindingCookieName = isProduction
  ? "__Host-garments-csrf-client"
  : "garments-csrf-client";

// Creates a random browser identifier before CSRF token generation.
export const csrfBindingMiddleware: RequestHandler = (
  req,
  res,
  next,
) => {
  try {
    const existingId = req.cookies?.[csrfBindingCookieName];

    const isValidId =
      typeof existingId === "string" &&
      /^[a-f0-9]{64}$/i.test(existingId);

    const bindingId = isValidId
      ? existingId
      : randomBytes(32).toString("hex");

    if (!isValidId) {
      res.cookie(csrfBindingCookieName, bindingId, {
        httpOnly: true,
        secure,
        sameSite,
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    // Make the new cookie value available to csrf-csrf
    // during this same request.
    req.cookies = req.cookies || {};
    req.cookies[csrfBindingCookieName] = bindingId;

    next();
  } catch (error) {
    next(error);
  }
};

const csrf = doubleCsrf({
  getSecret: () => csrfSecret,

  // Bind the signed CSRF token to this browser's random identifier.
  getSessionIdentifier: (req) => {
    const bindingId = req.cookies?.[csrfBindingCookieName];

    if (typeof bindingId !== "string") {
      throw new Error("CSRF client identifier is missing");
    }

    return bindingId;
  },

  cookieName: csrfCookieName,

  cookieOptions: {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },

  getCsrfTokenFromRequest: (req) =>
    req.get("x-csrf-token"),

  ignoredMethods: ["GET", "HEAD", "OPTIONS"],

  size: 32,
});

export const generateCsrfToken = csrf.generateCsrfToken;

export const doubleCsrfProtection =
  csrf.doubleCsrfProtection;