import type {
  Country,
  DashboardFilters,
  DateRangePreset,
  Platform,
} from "@/types";

/** Filters a brand-new dashboard starts with (RFC default window is the 7-day preset). */
export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  date_range: { preset: "last_7d" },
  platform: [],
  country: null,
  app_version_min: null,
};

/** Human labels + the adaptive-cache window each preset maps to backend-side (RFC TTL table). */
export const DATE_RANGE_PRESETS: ReadonlyArray<{
  value: DateRangePreset;
  label: string;
}> = [
  { value: "last_1h", label: "Last 1 hour" },
  { value: "last_24h", label: "Last 24 hours" },
  { value: "last_7d", label: "Last 7 days" },
  { value: "last_30d", label: "Last 30 days" },
  { value: "last_90d", label: "Last 90 days" },
];

export const PLATFORMS: ReadonlyArray<{ value: Platform; label: string }> = [
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
];

export const COUNTRIES: ReadonlyArray<{ value: Country; label: string }> = [
  { value: "br", label: "Brazil" },
  { value: "mx", label: "Mexico" },
  { value: "co", label: "Colombia" },
  { value: "us", label: "United States" },
];

/** Sentinel used in Select components where the empty option means "no country filter". */
export const COUNTRY_ANY = "__any__";
