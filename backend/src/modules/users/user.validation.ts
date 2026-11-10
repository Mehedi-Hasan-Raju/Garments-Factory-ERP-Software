
import { z } from "zod";

export const createUserSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .max(150, "Email cannot exceed 150 characters")
      .transform((value) => value.toLowerCase()),

    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .max(72, "Password cannot exceed 72 characters"),

    roleCode: z.enum([
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
      "ACCOUNTANT",
      "STOREKEEPER",
    ]),
  })
  .strict();

export type CreateUserInput = z.infer<
  typeof createUserSchema
>;
