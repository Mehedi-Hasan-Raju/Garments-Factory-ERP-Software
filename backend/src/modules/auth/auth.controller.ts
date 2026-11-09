import type { Request, Response, NextFunction } from "express";

import { authService } from "./auth.service.js";
import { loginSchema } from "./auth.validation.js";
import { AUTH_CONSTANTS } from "./auth.constant.js";
import { generateCsrfToken } from "../../middlewares/csrf.middleware.js";

const ACCESS_COOKIE =
  AUTH_CONSTANTS.COOKIE_NAMES.ACCESS_TOKEN;

const REFRESH_COOKIE =
  AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN;

const REFRESH_TOKEN_MAX_AGE =
  AUTH_CONSTANTS.REFRESH_TOKEN_DAYS *
  24 *
  60 *
  60 *
  1000;


const isProduction = process.env.NODE_ENV === "production";

const configuredSameSite = (
  process.env.COOKIE_SAME_SITE || "lax"
).toLowerCase();

if (!["strict", "lax", "none"].includes(configuredSameSite)) {
  throw new Error(
    "Invalid COOKIE_SAME_SITE. Use strict, lax, or none.",
  );
}

const sameSite = configuredSameSite as
  "strict" | "lax" | "none";

const secure =
  isProduction || process.env.COOKIE_SECURE === "true";

if (sameSite === "none" && !secure) {
  throw new Error(
    "COOKIE_SAME_SITE=none requires COOKIE_SECURE=true or production mode.",
  );
}

const cookieOptions = {
  httpOnly: true,
  secure,
  sameSite,
  path: "/",
};


const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_COOKIE, cookieOptions);
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
};




export const authController = {
  async csrfToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const csrfToken = generateCsrfToken(req, res);

      res.status(200).json({
        success: true,
        message: "CSRF token generated successfully",
        data: {
          csrfToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validation = loginSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await authService.login(
        validation.data,
        {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      res.cookie(
        ACCESS_COOKIE,
        result.tokens.accessToken,
        {
          ...cookieOptions,
          maxAge: 15 * 60 * 1000,
        }
      );

      res.cookie(
        REFRESH_COOKIE,
        result.tokens.refreshToken,
        {
          ...cookieOptions,
          maxAge: REFRESH_TOKEN_MAX_AGE,
        }
      );

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  //refresh
  async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE];

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: "Refresh token is missing",
        });
        return;
      }

      const tokens = await authService.refresh(refreshToken);

      res.cookie(
        ACCESS_COOKIE,
        tokens.accessToken,
        {
          ...cookieOptions,
          maxAge: 15 * 60 * 1000,
        }
      );

      res.cookie(
        REFRESH_COOKIE,
        tokens.refreshToken,
        {
          ...cookieOptions,
          maxAge: REFRESH_TOKEN_MAX_AGE,
        }
      );

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
      });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  },


  async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE];

      await authService.logout(refreshToken);

      clearAuthCookies(res);

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  },
};
