import { z } from "zod";

export const dashboardQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
  recentLimit: z.coerce.number().int().min(1).max(10).default(5),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
