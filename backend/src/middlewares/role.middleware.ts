import type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";

export const allowRoles = (
  ...allowedRoles: string[]
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

    const userRole = req.authUser.role.code;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
      return;
    }

    next();
  };
};