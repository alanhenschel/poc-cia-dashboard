import { describe, expect, it } from "vitest";
import type { DashboardFilters } from "@/types";
import { buildSeries } from "./result-engine";
import type { ChartRecord } from "./store";

const chart: ChartRecord = {
  id: "chart-under-test",
  name: "Test chart",
  owner_id: "you@nubank.com.br",
  visualization_type: "line",
  query_definition: {
    metric: "screen_viewed",
    measurement: "unique_customers",
    filters: [],
    group_by: ["platform"],
  },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  deleted_at: null,
};

const baseFilters: DashboardFilters = {
  date_range: { preset: "last_7d" },
  platform: [],
  country: null,
  app_version_min: null,
};

const values = (filters: DashboardFilters): number[] =>
  buildSeries(chart, filters).flatMap((s) => s.points.map((p) => p.value));

const total = (filters: DashboardFilters): number =>
  values(filters).reduce((sum, v) => sum + v, 0);

describe("buildSeries filter sensitivity", () => {
  it("is deterministic: same chart + same filters → identical numbers", () => {
    expect(values(baseFilters)).toEqual(values(baseFilters));
  });

  it("changing platform selection changes the numbers", () => {
    expect(values({ ...baseFilters, platform: ["ios"] })).not.toEqual(values(baseFilters));
  });

  it("changing country changes the numbers (independent of the filter_conflict mechanic)", () => {
    expect(values({ ...baseFilters, country: "br" })).not.toEqual(
      values({ ...baseFilters, country: "mx" }),
    );
  });

  it("changing app_version_min changes the numbers", () => {
    expect(values({ ...baseFilters, app_version_min: "5.42.0" })).not.toEqual(
      values({ ...baseFilters, app_version_min: "5.60.0" }),
    );
  });

  it("platform is order-independent (['ios','android'] == ['android','ios'])", () => {
    expect(values({ ...baseFilters, platform: ["ios", "android"] })).toEqual(
      values({ ...baseFilters, platform: ["android", "ios"] }),
    );
  });

  it("narrowing reduces magnitude: a single platform totals less than all platforms", () => {
    expect(total({ ...baseFilters, platform: ["ios"] })).toBeLessThan(total(baseFilters));
  });

  it("narrowing to one country totals less than no country filter", () => {
    expect(total({ ...baseFilters, country: "br" })).toBeLessThan(total(baseFilters));
  });

  it("requiring a minimum app version totals less than no version floor", () => {
    expect(total({ ...baseFilters, app_version_min: "5.42.0" })).toBeLessThan(total(baseFilters));
  });
});

// ── Series labels are narrowed by the active filter (Session 7) ───────────────

const withGroupBy = (dimension: string): ChartRecord => ({
  ...chart,
  query_definition: { ...chart.query_definition, group_by: [dimension] },
});

const labels = (chartRecord: ChartRecord, filters: DashboardFilters): string[] =>
  buildSeries(chartRecord, filters).map((s) => s.label);

describe("buildSeries series-label narrowing", () => {
  it("country-grouped + country=br filter → only the Brazil series", () => {
    expect(labels(withGroupBy("country"), { ...baseFilters, country: "br" })).toEqual(["Brazil"]);
  });

  it("country-grouped + country=us filter → only the United States series (was previously missing)", () => {
    expect(labels(withGroupBy("country"), { ...baseFilters, country: "us" })).toEqual([
      "United States",
    ]);
  });

  it("country-grouped + no country filter → all four countries", () => {
    expect(labels(withGroupBy("country"), baseFilters)).toEqual([
      "Brazil",
      "Mexico",
      "Colombia",
      "United States",
    ]);
  });

  it("platform-grouped + one platform selected → only that platform's series", () => {
    expect(labels(withGroupBy("platform"), { ...baseFilters, platform: ["android"] })).toEqual([
      "Android",
    ]);
  });

  it("platform-grouped + no platform filter → both platforms, canonical order", () => {
    expect(labels(withGroupBy("platform"), baseFilters)).toEqual(["iOS", "Android"]);
  });

  it("platform selection is order-independent and stays canonical", () => {
    expect(labels(withGroupBy("platform"), { ...baseFilters, platform: ["android", "ios"] })).toEqual([
      "iOS",
      "Android",
    ]);
  });

  it("app_version-grouped + app_version_min excludes older version labels", () => {
    expect(labels(withGroupBy("app_version"), { ...baseFilters, app_version_min: "5.43.0" })).toEqual([
      "5.43.0",
    ]);
  });

  it("app_version-grouped + no floor → all versions", () => {
    expect(labels(withGroupBy("app_version"), baseFilters)).toEqual(["5.42.0", "5.43.0"]);
  });

  it("default (no group_by) → single Total series regardless of filters", () => {
    const noGroup = withGroupBy("");
    noGroup.query_definition.group_by = [];
    expect(labels(noGroup, { ...baseFilters, country: "br", platform: ["ios"] })).toEqual(["Total"]);
  });
});
