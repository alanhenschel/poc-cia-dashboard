import { z } from "zod";

/** Wire-level zod mirror of `DashboardFilters` (context.md Dashboard.filters). */
export const dateRangePresetSchema = z.enum([
  "last_1h",
  "last_24h",
  "last_7d",
  "last_30d",
  "last_90d",
]);

export const platformSchema = z.enum(["ios", "android"]);
export const countrySchema = z.enum(["br", "mx", "co", "us"]);

/** Semver-ish app version, e.g. "5.42.0". */
export const appVersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, "Use a version like 5.42.0");

export const dashboardFiltersSchema = z.object({
  date_range: z.object({ preset: dateRangePresetSchema }),
  platform: z.array(platformSchema),
  country: countrySchema.nullable(),
  app_version_min: appVersionSchema.nullable(),
});

export type DashboardFiltersInput = z.infer<typeof dashboardFiltersSchema>;
