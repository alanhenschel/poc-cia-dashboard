import { describe, expect, it } from "vitest";
import {
  appVersionSchema,
  countrySchema,
  dashboardFiltersSchema,
  dateRangePresetSchema,
  platformSchema,
} from "@/lib/schemas/filters.schema";

describe("appVersionSchema", () => {
  it("accepts semver-style versions", () => {
    expect(appVersionSchema.safeParse("5.42.0").success).toBe(true);
    expect(appVersionSchema.safeParse("10.0.123").success).toBe(true);
  });

  it("rejects non-semver strings", () => {
    for (const bad of ["5.42", "v5.42.0", "5.42.0-beta", "abc", ""]) {
      expect(appVersionSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe("enum schemas", () => {
  it("accepts valid values and rejects unknown ones", () => {
    expect(platformSchema.safeParse("ios").success).toBe(true);
    expect(platformSchema.safeParse("web").success).toBe(false);
    expect(countrySchema.safeParse("br").success).toBe(true);
    expect(countrySchema.safeParse("ar").success).toBe(false);
    expect(dateRangePresetSchema.safeParse("last_7d").success).toBe(true);
    expect(dateRangePresetSchema.safeParse("last_year").success).toBe(false);
  });
});

describe("dashboardFiltersSchema", () => {
  it("accepts a fully-specified filter", () => {
    const result = dashboardFiltersSchema.safeParse({
      date_range: { preset: "last_7d" },
      platform: ["ios", "android"],
      country: "br",
      app_version_min: "5.42.0",
    });
    expect(result.success).toBe(true);
  });

  it("accepts nulls for the optional country / app_version_min", () => {
    const result = dashboardFiltersSchema.safeParse({
      date_range: { preset: "last_24h" },
      platform: [],
      country: null,
      app_version_min: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid app_version_min", () => {
    const result = dashboardFiltersSchema.safeParse({
      date_range: { preset: "last_24h" },
      platform: [],
      country: null,
      app_version_min: "nope",
    });
    expect(result.success).toBe(false);
  });
});
