import { describe, expect, it, vi } from "vitest";

// Strip the mock "network" (latency + random failures) so these assert resolution logic deterministically.
vi.mock("@/services/mock/network", () => ({
  withRead: <T,>(op: () => T) => Promise.resolve(op()),
  withWrite: <T,>(op: () => T) => Promise.resolve(op()),
}));

import { getChartsByIds } from "@/services/chart.service";

// Seeded ids (see mock/seed.ts).
const SIGNUP = "018f5d92-1a4f-7c22-b8e1-2a9f0c4d51bb";
const APP_OPENS = "018f5d92-2b60-7d10-a1c2-77e0a1b2c3d4";
const DELETED = "018f5d92-6fa4-7150-e506-bbc4e5f60718"; // soft-deleted in the seed

describe("getChartsByIds", () => {
  it("de-duplicates repeated ids", async () => {
    const charts = await getChartsByIds([SIGNUP, SIGNUP, SIGNUP]);
    expect(charts).toHaveLength(1);
    expect(charts[0].id).toBe(SIGNUP);
  });

  it("omits ids that don't exist", async () => {
    const charts = await getChartsByIds(["does-not-exist"]);
    expect(charts).toHaveLength(0);
  });

  it("excludes soft-deleted charts", async () => {
    const charts = await getChartsByIds([DELETED]);
    expect(charts).toHaveLength(0);
  });

  it("resolves multiple ids and is order-independent on membership", async () => {
    const forward = await getChartsByIds([SIGNUP, APP_OPENS]);
    const reverse = await getChartsByIds([APP_OPENS, SIGNUP]);
    expect(new Set(forward.map((c) => c.id))).toEqual(new Set([SIGNUP, APP_OPENS]));
    expect(new Set(reverse.map((c) => c.id))).toEqual(new Set(forward.map((c) => c.id)));
  });

  it("skips missing ids but returns the ones that exist (mixed input)", async () => {
    const charts = await getChartsByIds([SIGNUP, "missing", DELETED]);
    expect(charts.map((c) => c.id)).toEqual([SIGNUP]);
  });
});
