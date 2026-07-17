import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  hydrateStore,
  persistStore,
  store,
  type ChartRecord,
  type DashboardRecord,
} from "@/services/mock/store";

const STORAGE_KEY = "cia-dashboards.mock.v1";

const chart = (id: string): ChartRecord => ({
  id,
  name: `Chart ${id}`,
  owner_id: "you@nubank.com.br",
  visualization_type: "line",
  query_definition: { metric: "screen_viewed", measurement: "unique_customers", filters: [], group_by: [] },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  deleted_at: null,
});

const dash = (id: string): DashboardRecord => ({
  id,
  name: `Dashboard ${id}`,
  owner_id: "you@nubank.com.br",
  tags: ["x"],
  filters: { date_range: { preset: "last_7d" }, platform: [], country: null, app_version_min: null },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

function resetStore() {
  store.charts = new Map();
  store.dashboards = new Map();
  store.widgets = new Map();
  store.runtime = new Map();
}

beforeEach(() => {
  window.localStorage.clear();
  resetStore();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("mock store persistence", () => {
  it("round-trips durable records through localStorage", () => {
    store.charts.set("c1", chart("c1"));
    store.dashboards.set("d1", dash("d1"));
    persistStore();

    resetStore();
    expect(store.charts.size).toBe(0);

    expect(hydrateStore()).toBe(true);
    expect(store.charts.get("c1")?.name).toBe("Chart c1");
    expect(store.dashboards.get("d1")?.name).toBe("Dashboard d1");
  });

  it("does not persist the ephemeral runtime cache", () => {
    store.charts.set("c1", chart("c1"));
    store.runtime.set("w1", { computed_at: 1, revalidate_at: null, rate_limited_until: null });
    persistStore();
    resetStore();
    hydrateStore();
    expect(store.runtime.size).toBe(0);
  });

  it("returns false (→ seed fallback) when storage is absent", () => {
    window.localStorage.clear();
    expect(hydrateStore()).toBe(false);
  });

  it("returns false (→ seed fallback) when storage is corrupt", () => {
    window.localStorage.setItem(STORAGE_KEY, "{ not valid json ");
    expect(hydrateStore()).toBe(false);
  });

  it("returns false when the payload has the wrong shape", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ charts: "nope" }));
    expect(hydrateStore()).toBe(false);
  });

  it("SSR no-op: does not throw and hydrate returns false when window is undefined", () => {
    vi.stubGlobal("window", undefined);
    expect(() => persistStore()).not.toThrow();
    expect(hydrateStore()).toBe(false);
  });
});
