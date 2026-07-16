import { create } from "zustand";
import type { Dashboard, DashboardFilters, WidgetPosition } from "@/types";

/**
 * Dashboard-local UI state (NOT server state — that lives in TanStack Query).
 * Holds the active global filter selection, grid edit mode, and the draft layout being edited.
 */
interface DashboardEditorState {
  dashboardId: string | null;
  editMode: boolean;
  /** Active filters driving the results query; seeded from the dashboard, mutated by the filter bar. */
  filters: DashboardFilters | null;
  /** Draft `{x,y,w,h}` per widget id, edited via drag/resize before an explicit save. */
  layout: Record<string, WidgetPosition>;
  layoutDirty: boolean;

  /** Resets all editor state from a freshly loaded dashboard. Call when the dashboard id changes. */
  initialize: (dashboard: Dashboard) => void;
  setEditMode: (editMode: boolean) => void;
  setFilters: (filters: DashboardFilters) => void;
  setLayout: (layout: Record<string, WidgetPosition>) => void;
  /** Re-baseline the draft layout from server widgets (after add/remove) without losing edit mode. */
  syncLayout: (dashboard: Dashboard) => void;
  markLayoutSaved: () => void;
}

function layoutFromDashboard(dashboard: Dashboard): Record<string, WidgetPosition> {
  return Object.fromEntries(dashboard.widgets.map((w) => [w.id, w.position]));
}

export const useDashboardEditorStore = create<DashboardEditorState>((set) => ({
  dashboardId: null,
  editMode: false,
  filters: null,
  layout: {},
  layoutDirty: false,

  initialize: (dashboard) =>
    set({
      dashboardId: dashboard.id,
      editMode: false,
      filters: dashboard.filters,
      layout: layoutFromDashboard(dashboard),
      layoutDirty: false,
    }),

  setEditMode: (editMode) => set({ editMode }),

  setFilters: (filters) => set({ filters }),

  setLayout: (layout) => set({ layout, layoutDirty: true }),

  // Re-baseline after a widget add/remove: keep any unsaved draft position for surviving widgets,
  // seed the server position for newly added ones, and drop entries for removed ones. Deliberately
  // does NOT touch `layoutDirty`, so pending drags aren't silently discarded by an add/remove.
  syncLayout: (dashboard) =>
    set((state) => ({
      layout: Object.fromEntries(
        dashboard.widgets.map((w) => [w.id, state.layout[w.id] ?? w.position]),
      ),
    })),

  markLayoutSaved: () => set({ layoutDirty: false }),
}));
