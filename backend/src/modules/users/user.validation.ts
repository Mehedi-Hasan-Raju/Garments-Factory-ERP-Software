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

export const userQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(10),

    search: z.string().trim().max(150).optional(),

    roleCode: z
      .enum([
        "OWNER",
        "ADMIN",
        "MANAGER",
        "EMPLOYEE",
        "ACCOUNTANT",
        "STOREKEEPER",
      ])
      .optional(),

    status: z
      .enum(["ACTIVE", "DISABLED", "LOCKED"])
      .optional(),

    sortBy: z
      .enum(["createdAt", "email", "lastLoginAt"])
      .default("createdAt"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;

export type UserQueryInput = z.infer<typeof userQuerySchema>;