import type {
  Chart,
  ChartListItem,
  Dashboard,
  DashboardFilters,
  DashboardListItem,
  QueryDefinition,
  VisualizationType,
  Widget,
  WidgetPosition,
  WidgetType,
} from "@/types";
import { MOCK_PRINCIPAL } from "./config";

/**
 * In-memory persistence for the mock backend. These records are the mock's "Datomic": the
 * canonical stored shape, from which the wire shapes (with derived `can_mutate` / counters) are
 * projected. Nothing outside `services/mock` should import this module.
 */

export interface ChartRecord {
  id: string;
  name: string;
  owner_id: string;
  visualization_type: VisualizationType;
  query_definition: QueryDefinition;
  created_at: string;
  updated_at: string;
  /** Soft-delete marker (roadmap: chart delete = soft delete). Non-null → hidden from listings. */
  deleted_at: string | null;
}

export interface DashboardRecord {
  id: string;
  name: string;
  owner_id: string;
  tags: string[];
  filters: DashboardFilters;
  created_at: string;
  updated_at: string;
}

/** Forces a widget into a specific result state for demo coverage of rarely-occurring states. */
export type WidgetDemoState = "forbidden" | "rate_limited";

export interface WidgetRecord {
  id: string;
  dashboard_id: string;
  type: WidgetType;
  chart_id: string;
  position: WidgetPosition;
  created_at: string;
  demo_state?: WidgetDemoState;
}

/** Per-widget cache runtime used by the result engine to simulate stale-while-revalidate. */
export interface WidgetRuntime {
  computed_at: number;
  /** When set and in the future, the widget is currently stale and being revalidated. */
  revalidate_at: number | null;
  /** When set and in the future, the widget is rate-limited. */
  rate_limited_until: number | null;
}

interface Store {
  charts: Map<string, ChartRecord>;
  dashboards: Map<string, DashboardRecord>;
  widgets: Map<string, WidgetRecord>;
  runtime: Map<string, WidgetRuntime>;
}

export const store: Store = {
  charts: new Map(),
  dashboards: new Map(),
  widgets: new Map(),
  runtime: new Map(),
};

// ── Persistence (localStorage) ───────────────────────────────────────────────
// The mock is the stand-in for cia-backend's Datomic. Without durable storage, anything created
// during a session (new dashboard, saved layout, forked chart) would vanish on reload — which would
// silently break the "canonical URL is the sharing mechanism" bet. So the record maps (not the
// ephemeral `runtime` cache) are hydrated on init and written through on every mutation.

const STORAGE_KEY = "cia-dashboards.mock.v1";

interface PersistedShape {
  charts: ChartRecord[];
  dashboards: DashboardRecord[];
  widgets: WidgetRecord[];
}

/** Serializes the durable record maps to localStorage. No-op on the server; swallows quota errors. */
export function persistStore(): void {
  if (typeof window === "undefined") return;
  try {
    const data: PersistedShape = {
      charts: [...store.charts.values()],
      dashboards: [...store.dashboards.values()],
      widgets: [...store.widgets.values()],
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage full / unavailable — the in-memory store still works for this session */
  }
}

/**
 * Loads a persisted store if present & well-formed. Returns false to signal "seed instead".
 *
 * KNOWN GAP (acceptable for the mock): validation is shape-only (top-level `Array.isArray` per
 * collection) — individual record fields are trusted, and the only migration mechanism is the `.v1`
 * suffix in STORAGE_KEY. When the record schema changes, bump the key (`.v2`) to discard old data, or
 * add a real per-record validate + migrate step here. The real cia-backend/Datomic owns schema
 * evolution; this is only to keep a browser demo's localStorage from crashing on a stale payload.
 */
export function hydrateStore(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as Partial<PersistedShape>;
    if (!Array.isArray(data.charts) || !Array.isArray(data.dashboards) || !Array.isArray(data.widgets)) {
      return false;
    }
    store.charts = new Map(data.charts.map((c) => [c.id, c]));
    store.dashboards = new Map(data.dashboards.map((d) => [d.id, d]));
    store.widgets = new Map(data.widgets.map((w) => [w.id, w]));
    store.runtime = new Map();
    return true;
  } catch {
    return false; // corrupt payload → fall back to the seed
  }
}

// ── Derived helpers ──────────────────────────────────────────────────────────

export function widgetsForDashboard(dashboardId: string): WidgetRecord[] {
  return [...store.widgets.values()].filter((w) => w.dashboard_id === dashboardId);
}

export function widgetCount(dashboardId: string): number {
  return widgetsForDashboard(dashboardId).length;
}

/** Distinct dashboards referencing a chart via a widget (drives `used_in_dashboards_count`). */
export function usedInDashboardsCount(chartId: string): number {
  const dashboardIds = new Set<string>();
  for (const w of store.widgets.values()) {
    if (w.chart_id === chartId) dashboardIds.add(w.dashboard_id);
  }
  return dashboardIds.size;
}

export function canMutate(ownerId: string): boolean {
  return ownerId === MOCK_PRINCIPAL;
}

// ── Record → wire projections ────────────────────────────────────────────────

export function toChartWire(record: ChartRecord): Chart {
  return {
    id: record.id,
    name: record.name,
    owner_id: record.owner_id,
    can_mutate: canMutate(record.owner_id),
    visualization_type: record.visualization_type,
    query_definition: record.query_definition,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export function toChartListItem(record: ChartRecord): ChartListItem {
  return {
    id: record.id,
    name: record.name,
    owner_id: record.owner_id,
    can_mutate: canMutate(record.owner_id),
    used_in_dashboards_count: usedInDashboardsCount(record.id),
    visualization_type: record.visualization_type,
    updated_at: record.updated_at,
  };
}

export function toWidgetWire(record: WidgetRecord): Widget {
  return {
    id: record.id,
    dashboard_id: record.dashboard_id,
    type: record.type,
    chart_id: record.chart_id,
    position: record.position,
    created_at: record.created_at,
  };
}

export function toDashboardWire(record: DashboardRecord): Dashboard {
  return {
    id: record.id,
    name: record.name,
    owner_id: record.owner_id,
    can_mutate: canMutate(record.owner_id),
    tags: record.tags,
    filters: record.filters,
    widgets: widgetsForDashboard(record.id).map((w) => ({
      id: w.id,
      type: w.type,
      chart_id: w.chart_id,
      position: w.position,
    })),
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export function toDashboardListItem(record: DashboardRecord): DashboardListItem {
  return {
    id: record.id,
    name: record.name,
    owner_id: record.owner_id,
    can_mutate: canMutate(record.owner_id),
    widget_count: widgetCount(record.id),
    tags: record.tags,
    updated_at: record.updated_at,
  };
}
