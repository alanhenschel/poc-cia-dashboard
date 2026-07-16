import { beforeEach, describe, expect, it } from "vitest";
import type { Dashboard, DashboardWidget } from "@/types";
import { useDashboardEditorStore } from "./dashboard-editor.store";

const widget = (id: string, x: number, y: number): DashboardWidget => ({
  id,
  type: "chart",
  chart_id: `chart-${id}`,
  position: { x, y, w: 6, h: 4 },
});

const dashboard = (widgets: DashboardWidget[]): Dashboard => ({
  id: "dash-1",
  name: "Test",
  owner_id: "you@nubank.com.br",
  can_mutate: true,
  tags: [],
  filters: { date_range: { preset: "last_7d" }, platform: [], country: null, app_version_min: null },
  widgets,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

const store = useDashboardEditorStore;

beforeEach(() => {
  store.setState({
    dashboardId: null,
    editMode: false,
    filters: null,
    layout: {},
    layoutDirty: false,
  });
});

describe("dashboard editor store", () => {
  it("initialize seeds layout from widgets and clears dirty/edit state", () => {
    store.getState().initialize(dashboard([widget("a", 0, 0), widget("b", 6, 0)]));
    const s = store.getState();
    expect(s.dashboardId).toBe("dash-1");
    expect(s.editMode).toBe(false);
    expect(s.layoutDirty).toBe(false);
    expect(s.layout).toEqual({ a: { x: 0, y: 0, w: 6, h: 4 }, b: { x: 6, y: 0, w: 6, h: 4 } });
  });

  it("setLayout is the ONLY thing that marks the layout dirty", () => {
    store.getState().initialize(dashboard([widget("a", 0, 0)]));
    expect(store.getState().layoutDirty).toBe(false);
    store.getState().setLayout({ a: { x: 3, y: 0, w: 6, h: 4 } });
    expect(store.getState().layoutDirty).toBe(true);
  });

  it("markLayoutSaved clears the dirty flag", () => {
    store.getState().initialize(dashboard([widget("a", 0, 0)]));
    store.getState().setLayout({ a: { x: 3, y: 0, w: 6, h: 4 } });
    store.getState().markLayoutSaved();
    expect(store.getState().layoutDirty).toBe(false);
  });

  it("FIX #4: syncLayout (widget add/remove) does NOT mark the layout dirty", () => {
    const base = dashboard([widget("a", 0, 0), widget("b", 6, 0)]);
    store.getState().initialize(base);
    expect(store.getState().layoutDirty).toBe(false);

    // Simulate a widget being removed and a new one added — the add/remove effect calls syncLayout.
    const afterAddRemove = dashboard([widget("a", 0, 0), widget("c", 0, 4)]); // b removed, c added
    store.getState().syncLayout(afterAddRemove);

    expect(store.getState().layoutDirty).toBe(false); // add/remove alone must never dirty the layout
  });

  it("syncLayout merges: survivors keep draft position, new widgets get server position, removed drop out, dirty untouched", () => {
    store.getState().initialize(dashboard([widget("a", 0, 0), widget("b", 6, 0)]));

    // User drags 'a' (unsaved) → draft position differs from server, layout marked dirty.
    store.getState().setLayout({ a: { x: 2, y: 1, w: 6, h: 4 }, b: { x: 6, y: 0, w: 6, h: 4 } });
    expect(store.getState().layoutDirty).toBe(true);

    // Now 'b' is removed and 'c' is added at a server position.
    store.getState().syncLayout(dashboard([widget("a", 0, 0), widget("c", 0, 8)]));

    const s = store.getState();
    expect(s.layout.a).toEqual({ x: 2, y: 1, w: 6, h: 4 }); // survivor keeps the unsaved draft position
    expect(s.layout.c).toEqual({ x: 0, y: 8, w: 6, h: 4 }); // new widget gets its server position
    expect(s.layout.b).toBeUndefined(); // removed widget dropped
    expect(s.layoutDirty).toBe(true); // pending drag NOT discarded
  });
});
