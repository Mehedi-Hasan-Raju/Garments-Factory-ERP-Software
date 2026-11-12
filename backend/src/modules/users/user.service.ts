
import bcrypt from "bcrypt";

import { AppError } from "../../lib/app-error.js";
import { AUTH_CONSTANTS } from "../auth/auth.constant.js";

import { userRepository } from "./user.repository.js";
import type { CreateUserInput } from "./user.validation.js";

// Account creation hierarchy
const ROLE_CREATION_RULES: Record<string, string[]> = {
  OWNER: ["ADMIN", "ACCOUNTANT"],

  ADMIN: [
    "MANAGER",
    "ACCOUNTANT",
    "STOREKEEPER",
  ],

  MANAGER: [
    "EMPLOYEE",
    "STOREKEEPER",
  ],

  EMPLOYEE: [],
  ACCOUNTANT: [],
  STOREKEEPER: [],
};

export const userService = {
  async createUser(
    creatorId: string,
    tokenRoleCode: string,
    input: CreateUserInput,
  ) {
    
    const creator =
      await userRepository.findCreatorById(creatorId);

    if (!creator) {
      throw new AppError(
        "Creator account not found",
        401,
      );
    }

    
    if (creator.status !== "ACTIVE") {
      throw new AppError(
        "Your account is not active",
        403,
      );
    }

    
    if (!creator.role.isActive) {
      throw new AppError(
        "Your assigned role is not active",
        403,
      );
    }

    
    if (creator.role.code !== tokenRoleCode) {
      throw new AppError(
        "Your role has changed. Please login again",
        403,
      );
    }

   
   
    const allowedRoles =
      ROLE_CREATION_RULES[creator.role.code] || [];

    if (!allowedRoles.includes(input.roleCode)) {
      throw new AppError(
        `${creator.role.code} cannot create ${input.roleCode} accounts`,
        403,
      );
    }

   
    const targetRole =
      await userRepository.findRoleByCode(
        input.roleCode,
      );

    if (!targetRole || !targetRole.isActive) {
      throw new AppError(
        "Selected role does not exist or is inactive",
        400,
      );
    }

   
    const existingUser =
      await userRepository.findUserByEmail(
        input.email,
      );

    if (existingUser) {
      throw new AppError(
        "An account with this email already exists",
        409,
      );
    }

    
    const passwordHash = await bcrypt.hash(
      input.password,
      AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS,
    );

   
    try {
      const user = await userRepository.createUser({
        email: input.email,
        passwordHash,
        roleId: targetRole.id,
      });

      return user;
    } catch (error) {
    
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new AppError(
          "An account with this email already exists",
          409,
        );
      }

      throw error;
    }
  },
};
