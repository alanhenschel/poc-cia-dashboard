/**
 * The single global dashboard filter (RFC: "filters is a single set valid for all widgets").
 * Shape mirrors the `filters` object in the Dashboard response.
 */

/** Date-range presets confirmed as the V1 filterable window (RFC Open Questions + cache TTL table). */
export type DateRangePreset =
  | "last_1h"
  | "last_24h"
  | "last_7d"
  | "last_30d"
  | "last_90d";

export interface DateRangeFilter {
  preset: DateRangePreset;
}

/** Platform dimension. RFC example: `"platform": ["ios", "android"]`. */
export type Platform = "ios" | "android";

/** Country dimension. RFC example: `"country": "br"`. Kept as a string set for extensibility. */
export type Country = "br" | "mx" | "co" | "us";

/**
 * The dashboard-level filter. `app_version_min` is a semver-ish string (RFC: "5.42.0").
 * Every field is optional except the date range, which always has a preset.
 */
export interface DashboardFilters {
  date_range: DateRangeFilter;
  platform: Platform[];
  country: Country | null;
  app_version_min: string | null;
}
