
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { AppError } from "../../lib/app-error.js";

import { userService } from "./user.service.js";
import { createUserSchema } from "./user.validation.js";

export const userController = {
  async createUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validation = createUserSchema.safeParse(
        req.body,
      );

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      if (!req.authUser) {
        throw new AppError(
          "Authentication required",
          401,
        );
      }

      const user = await userService.createUser(
        req.authUser.id,
        req.authUser.role.code,
        validation.data,
      );

      res.status(201).json({
        success: true,
        message: "User account created successfully",
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
