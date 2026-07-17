import { beforeEach, describe, expect, it, vi } from "vitest";

// Strip the mock "network" (latency + random failures) so these assert resolution logic deterministically.
const networkMocks = vi.hoisted(() => ({
  withRead: vi.fn(async <T,>(op: () => T | Promise<T>) => op()),
  withWrite: vi.fn(async <T,>(op: () => T | Promise<T>) => op()),
}));

vi.mock("@/services/mock/network", () => ({
  withRead: networkMocks.withRead,
  withWrite: networkMocks.withWrite,
}));

import {
  copyChart,
  createChart,
  deleteChart,
  getChart,
  getChartsByIds,
  listCharts,
  updateChart,
} from "@/services/chart.service";
import type { QueryDefinition } from "@/types";

// Seeded ids (see mock/seed.ts).
const SIGNUP = "018f5d92-1a4f-7c22-b8e1-2a9f0c4d51bb"; // owned by isabela (not the principal)
const APP_OPENS = "018f5d92-2b60-7d10-a1c2-77e0a1b2c3d4"; // owned by the principal
const DELETED = "018f5d92-6fa4-7150-e506-bbc4e5f60718"; // soft-deleted in the seed

const queryDef: QueryDefinition = {
  metric: "screen_viewed",
  measurement: "unique_customers",
  filters: [],
  group_by: ["platform"],
};

beforeEach(() => {
  networkMocks.withRead.mockClear();
  networkMocks.withWrite.mockClear();
});

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

describe("chart.service — reads", () => {
  it("lists charts, excludes soft-deleted, and reflects used_in_dashboards_count", async () => {
    const page = await listCharts();
    expect(page.items.some((c) => c.id === DELETED)).toBe(false);
    const appOpens = page.items.find((c) => c.id === APP_OPENS);
    expect(appOpens).toBeDefined();
    expect(typeof appOpens?.used_in_dashboards_count).toBe("number");
  });

  it("filters the list by search term", async () => {
    const page = await listCharts({ search: "sign-up" });
    expect(page.items.every((c) => c.name.toLowerCase().includes("sign-up"))).toBe(true);
  });

  it("gets a chart by id; 404s on a soft-deleted or unknown id", async () => {
    expect((await getChart(APP_OPENS)).can_mutate).toBe(true);
    await expect(getChart(DELETED)).rejects.toMatchObject({ status: 404 });
    await expect(getChart("nope")).rejects.toMatchObject({ status: 404 });
  });
});

describe("chart.service — mutations + authorization", () => {
  it("runs every mutation through the write wrapper, never the read wrapper", async () => {
    const created = await createChart({
      name: "Write boundary",
      visualization_type: "line",
      query_definition: queryDef,
    });
    await updateChart(created.id, { name: "Write boundary edited" });
    await copyChart(SIGNUP);
    await deleteChart(created.id);

    expect(networkMocks.withWrite).toHaveBeenCalledTimes(4);
    expect(networkMocks.withRead).not.toHaveBeenCalled();
  });

  it("creates a chart owned by the principal", async () => {
    const created = await createChart({
      name: "New chart",
      visualization_type: "line",
      query_definition: queryDef,
    });
    expect(created.can_mutate).toBe(true);
    expect((await getChart(created.id)).name).toBe("New chart");
  });

  it("lets the owner update, but forbids editing someone else's chart (no admin bypass)", async () => {
    const created = await createChart({
      name: "Editable",
      visualization_type: "line",
      query_definition: queryDef,
    });
    const updated = await updateChart(created.id, { name: "Edited" });
    expect(updated.name).toBe("Edited");
    await expect(updateChart(SIGNUP, { name: "hijack" })).rejects.toMatchObject({ status: 403 });
  });

  it("soft-deletes an owned chart (gone from get + list); forbids deleting a non-owned one", async () => {
    const created = await createChart({
      name: "Deletable",
      visualization_type: "line",
      query_definition: queryDef,
    });
    await deleteChart(created.id);
    await expect(getChart(created.id)).rejects.toMatchObject({ status: 404 });
    const page = await listCharts();
    expect(page.items.some((c) => c.id === created.id)).toBe(false);
    await expect(deleteChart(SIGNUP)).rejects.toMatchObject({ status: 403 });
  });

  it("forks any chart (incl. one you don't own) into a copy you own, with a new id", async () => {
    const clone = await copyChart(SIGNUP); // SIGNUP is owned by isabela
    expect(clone.id).not.toBe(SIGNUP);
    expect(clone.can_mutate).toBe(true);
    expect(clone.name).toMatch(/copy/i);
  });
});
