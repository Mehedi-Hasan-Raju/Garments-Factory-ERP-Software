import type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";

import { authService } from "./auth.service.js";
import { AUTH_CONSTANTS } from "./auth.constant.js";

// Verify access token and authenticate user
export const authenticate: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessCookie =
      AUTH_CONSTANTS.COOKIE_NAMES.ACCESS_TOKEN;

    const authorization = req.headers.authorization;

    const bearerToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : undefined;

    const accessToken =
      req.cookies?.[accessCookie] ?? bearerToken;

    if (!accessToken) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const authentication =
      await authService.authenticateAccessToken(accessToken);

    req.authUser = authentication.user;
    req.authSessionId = authentication.sessionId;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication",
    });
  }
};

// Check whether user has a specific permission
export const requirePermission = (
  permissionCode: string
): RequestHandler => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.authUser) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const hasPermission =
      req.authUser.role.permissions.includes(permissionCode);

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
      return;
    }

    next();
  };
};

// Check whether user has at least one of the permissions
export const requireAnyPermission = (
  ...permissionCodes: string[]
): RequestHandler => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.authUser) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const hasPermission = permissionCodes.some((permission) =>
      req.authUser?.role.permissions.includes(permission)
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};
