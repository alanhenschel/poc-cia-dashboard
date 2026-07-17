import { beforeEach, describe, expect, it, vi } from "vitest";

// Deterministic: strip latency + random transient failures from the mock "network".
const networkMocks = vi.hoisted(() => ({
  withRead: vi.fn(async <T,>(op: () => T | Promise<T>) => op()),
  withWrite: vi.fn(async <T,>(op: () => T | Promise<T>) => op()),
}));

vi.mock("@/services/mock/network", () => ({
  withRead: networkMocks.withRead,
  withWrite: networkMocks.withWrite,
}));

import {
  addWidget,
  createDashboard,
  deleteDashboard,
  deleteWidget,
  getDashboard,
  getDashboardResults,
  listDashboards,
  updateDashboard,
  updateWidget,
  updateWidgetLayout,
} from "@/services/dashboard.service";
import type { WidgetPosition } from "@/types";

// Seeded fixtures (see mock/seed.ts).
const OWNED = "018f5e4a-3d21-7b4c-ae51-401d9caf3f88"; // Payments health — owned by the mock principal
const NOT_OWNED = "018f5e4a-2c10-7a3b-9d40-3f1c8b9a2e77"; // Onboarding funnel — owned by isabela
const OWNED_CHART = "018f5d92-2b60-7d10-a1c2-77e0a1b2c3d4"; // App opens
const DELETED_CHART = "018f5d92-6fa4-7150-e506-bbc4e5f60718"; // soft-deleted

const pos: WidgetPosition = { x: 0, y: 0, w: 6, h: 4 };

beforeEach(() => {
  networkMocks.withRead.mockClear();
  networkMocks.withWrite.mockClear();
});

describe("dashboard.service — reads", () => {
  it("lists seeded dashboards and marks ownership via can_mutate", async () => {
    const page = await listDashboards();
    const owned = page.items.find((d) => d.id === OWNED);
    const notOwned = page.items.find((d) => d.id === NOT_OWNED);
    expect(owned?.can_mutate).toBe(true);
    expect(notOwned?.can_mutate).toBe(false);
  });

  it("filters the list by search term (name/owner/tag)", async () => {
    const page = await listDashboards({ search: "payments" });
    expect(page.items.every((d) => d.name.toLowerCase().includes("payments"))).toBe(true);
    expect(page.items.some((d) => d.id === OWNED)).toBe(true);
  });

  it("gets a dashboard by id and 404s on an unknown id", async () => {
    expect((await getDashboard(OWNED)).name).toContain("Payments");
    await expect(getDashboard("nope")).rejects.toMatchObject({ status: 404 });
  });

  it("returns a batch result for every widget", async () => {
    const dashboard = await getDashboard(OWNED);
    const results = await getDashboardResults(OWNED, dashboard.filters);
    expect(results.items).toHaveLength(dashboard.widgets.length);
  });
});

describe("dashboard.service — mutations + authorization", () => {
  it("runs every mutation through the write wrapper, never the read wrapper", async () => {
    const created = await createDashboard({ name: "Write boundary", tags: [] });
    await updateDashboard(created.id, { name: "Write boundary edited" });
    const widget = await addWidget(created.id, { chart_id: OWNED_CHART, position: pos });
    await updateWidget(created.id, widget.id, { position: { x: 1, y: 1, w: 6, h: 4 } });
    await updateWidgetLayout(created.id, [{ id: widget.id, position: { x: 1, y: 1, w: 6, h: 4 } }]);
    await deleteWidget(created.id, widget.id);
    await deleteDashboard(created.id);

    expect(networkMocks.withWrite).toHaveBeenCalledTimes(7);
    expect(networkMocks.withRead).not.toHaveBeenCalled();
  });

  it("creates a dashboard owned by the principal, defaulting filters when omitted", async () => {
    const created = await createDashboard({ name: "Test dash", tags: ["qa"] });
    expect(created.can_mutate).toBe(true);
    expect(created.filters.date_range.preset).toBe("last_7d");
    expect((await getDashboard(created.id)).name).toBe("Test dash");
  });

  it("lets the owner rename, but forbids mutating someone else's dashboard", async () => {
    const created = await createDashboard({ name: "Renamable", tags: [] });
    const updated = await updateDashboard(created.id, { name: "Renamed" });
    expect(updated.name).toBe("Renamed");
    await expect(updateDashboard(NOT_OWNED, { name: "hijack" })).rejects.toMatchObject({ status: 403 });
  });

  it("deletes an owned dashboard (then 404s), and forbids deleting a non-owned one", async () => {
    const created = await createDashboard({ name: "Disposable", tags: [] });
    await deleteDashboard(created.id);
    await expect(getDashboard(created.id)).rejects.toMatchObject({ status: 404 });
    await expect(deleteDashboard(NOT_OWNED)).rejects.toMatchObject({ status: 403 });
  });

  it("adds a widget for a valid chart, rejects a soft-deleted chart, forbids non-owners", async () => {
    const created = await createDashboard({ name: "Widgets", tags: [] });
    const widget = await addWidget(created.id, { chart_id: OWNED_CHART, position: pos });
    expect(widget.chart_id).toBe(OWNED_CHART);

    await expect(
      addWidget(created.id, { chart_id: DELETED_CHART, position: pos }),
    ).rejects.toMatchObject({ status: 422 });

    await expect(
      addWidget(NOT_OWNED, { chart_id: OWNED_CHART, position: pos }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("deletes a widget and 404s on an unknown widget id", async () => {
    const created = await createDashboard({ name: "ToPrune", tags: [] });
    const widget = await addWidget(created.id, { chart_id: OWNED_CHART, position: pos });
    await deleteWidget(created.id, widget.id);
    const after = await getDashboard(created.id);
    expect(after.widgets.find((w) => w.id === widget.id)).toBeUndefined();
    await expect(deleteWidget(created.id, "missing")).rejects.toMatchObject({ status: 404 });
  });

  it("batch-persists widget layout positions", async () => {
    const created = await createDashboard({ name: "Layout", tags: [] });
    const widget = await addWidget(created.id, { chart_id: OWNED_CHART, position: pos });
    await updateWidgetLayout(created.id, [{ id: widget.id, position: { x: 3, y: 2, w: 8, h: 5 } }]);
    const after = await getDashboard(created.id);
    expect(after.widgets.find((w) => w.id === widget.id)?.position).toEqual({ x: 3, y: 2, w: 8, h: 5 });
  });
});
