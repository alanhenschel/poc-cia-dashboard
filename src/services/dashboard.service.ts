import { DEFAULT_DASHBOARD_FILTERS } from "@/constants/filters";
import type {
  BatchWidgetResults,
  Dashboard,
  DashboardFilters,
  DashboardListItem,
  ListParams,
  Paginated,
  Widget,
  WidgetPosition,
} from "@/types";
import { ApiError } from "@/lib/api-error";
import { MOCK_PRINCIPAL } from "./mock/config";
import { newId, nowIso } from "./mock/ids";
import { withRead, withWrite } from "./mock/network";
import { paginate } from "./mock/pagination";
import { computeWidgetResult } from "./mock/result-engine";
import { ensureSeeded } from "./mock/seed";
import {
  canMutate,
  store,
  toDashboardListItem,
  toDashboardWire,
  toWidgetWire,
  widgetsForDashboard,
  type DashboardRecord,
  type WidgetRecord,
} from "./mock/store";

/**
 * Public Dashboards API facade. This file is the ONLY place the mock backend is reached for the
 * dashboards domain — to point the app at a real cia-backend, replace each body with a `fetch`
 * to the matching route in context.md. Signatures and return types stay identical.
 */

export interface CreateDashboardInput {
  name: string;
  tags: string[];
  filters?: DashboardFilters;
}

export interface UpdateDashboardInput {
  name?: string;
  tags?: string[];
  filters?: DashboardFilters;
}

export interface AddWidgetInput {
  chart_id: string;
  position: WidgetPosition;
}

export interface WidgetLayoutPatch {
  id: string;
  position: WidgetPosition;
}

function requireDashboard(id: string): DashboardRecord {
  const record = store.dashboards.get(id);
  if (!record) throw ApiError.notFound("dashboard", id);
  return record;
}

function requireMutableDashboard(id: string): DashboardRecord {
  const record = requireDashboard(id);
  if (!canMutate(record.owner_id)) throw ApiError.forbidden("dashboard", id);
  return record;
}

function matchesSearch(item: DashboardListItem, search?: string): boolean {
  if (!search) return true;
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return (
    item.name.toLowerCase().includes(needle) ||
    item.owner_id.toLowerCase().includes(needle) ||
    item.tags.some((t) => t.toLowerCase().includes(needle))
  );
}

// ── GET /api/dashboards ──────────────────────────────────────────────────────
export function listDashboards(params: ListParams = {}): Promise<Paginated<DashboardListItem>> {
  return withRead(() => {
    ensureSeeded();
    const items = [...store.dashboards.values()]
      .map(toDashboardListItem)
      .filter((item) => matchesSearch(item, params.search));
    return paginate(items, params.cursor, params.limit);
  });
}

// ── GET /api/dashboards/:id ──────────────────────────────────────────────────
export function getDashboard(id: string): Promise<Dashboard> {
  return withRead(() => {
    ensureSeeded();
    return toDashboardWire(requireDashboard(id));
  });
}

// ── POST /api/dashboards ─────────────────────────────────────────────────────
export function createDashboard(input: CreateDashboardInput): Promise<Dashboard> {
  return withWrite(() => {
    ensureSeeded();
    const timestamp = nowIso();
    const record: DashboardRecord = {
      id: newId(),
      name: input.name.trim(),
      owner_id: MOCK_PRINCIPAL,
      tags: input.tags,
      filters: input.filters ?? DEFAULT_DASHBOARD_FILTERS,
      created_at: timestamp,
      updated_at: timestamp,
    };
    store.dashboards.set(record.id, record);
    return toDashboardWire(record);
  });
}

// ── PATCH /api/dashboards/:id ────────────────────────────────────────────────
export function updateDashboard(id: string, patch: UpdateDashboardInput): Promise<Dashboard> {
  return withWrite(() => {
    ensureSeeded();
    const record = requireMutableDashboard(id);
    if (patch.name !== undefined) record.name = patch.name.trim();
    if (patch.tags !== undefined) record.tags = patch.tags;
    if (patch.filters !== undefined) record.filters = patch.filters;
    record.updated_at = nowIso();
    return toDashboardWire(record);
  });
}

// ── DELETE /api/dashboards/:id ───────────────────────────────────────────────
export function deleteDashboard(id: string): Promise<void> {
  return withWrite(() => {
    ensureSeeded();
    requireMutableDashboard(id);
    for (const widget of widgetsForDashboard(id)) {
      store.widgets.delete(widget.id);
      store.runtime.delete(widget.id);
    }
    store.dashboards.delete(id);
  });
}

// ── POST /api/dashboards/:id/widgets ─────────────────────────────────────────
export function addWidget(dashboardId: string, input: AddWidgetInput): Promise<Widget> {
  return withWrite(() => {
    ensureSeeded();
    const dashboard = requireMutableDashboard(dashboardId);
    const chart = store.charts.get(input.chart_id);
    if (!chart || chart.deleted_at) {
      // Reject missing OR soft-deleted charts (parity with chart.service's requireChart).
      throw ApiError.unprocessable("Referenced chart does not exist or was deleted.", {
        chart_id: input.chart_id,
      });
    }
    const record: WidgetRecord = {
      id: newId(),
      dashboard_id: dashboardId,
      type: "chart",
      chart_id: input.chart_id,
      position: input.position,
      created_at: nowIso(),
    };
    store.widgets.set(record.id, record);
    dashboard.updated_at = record.created_at;
    return toWidgetWire(record);
  });
}

// ── PATCH /api/dashboards/:id/widgets/:wid ───────────────────────────────────
export function updateWidget(
  dashboardId: string,
  widgetId: string,
  patch: { position: WidgetPosition },
): Promise<Widget> {
  return withWrite(() => {
    ensureSeeded();
    requireMutableDashboard(dashboardId);
    const widget = store.widgets.get(widgetId);
    if (!widget || widget.dashboard_id !== dashboardId) {
      throw ApiError.notFound("widget", widgetId);
    }
    widget.position = patch.position;
    return toWidgetWire(widget);
  });
}

/**
 * Batch layout persist — saves every widget's `{x,y,w,h}` in one call after a grid edit.
 * The single-widget PATCH above still exists for other cases; this keeps grid save to one round trip.
 */
export function updateWidgetLayout(
  dashboardId: string,
  patches: WidgetLayoutPatch[],
): Promise<Widget[]> {
  return withWrite(() => {
    ensureSeeded();
    const dashboard = requireMutableDashboard(dashboardId);
    const updated: WidgetRecord[] = [];
    for (const patch of patches) {
      const widget = store.widgets.get(patch.id);
      if (widget && widget.dashboard_id === dashboardId) {
        widget.position = patch.position;
        updated.push(widget);
      }
    }
    dashboard.updated_at = nowIso();
    return updated.map(toWidgetWire);
  });
}

// ── DELETE /api/dashboards/:id/widgets/:wid ──────────────────────────────────
export function deleteWidget(dashboardId: string, widgetId: string): Promise<void> {
  return withWrite(() => {
    ensureSeeded();
    const dashboard = requireMutableDashboard(dashboardId);
    const widget = store.widgets.get(widgetId);
    if (!widget || widget.dashboard_id !== dashboardId) {
      throw ApiError.notFound("widget", widgetId);
    }
    store.widgets.delete(widgetId);
    store.runtime.delete(widgetId);
    dashboard.updated_at = nowIso();
  });
}

// ── GET /api/dashboards/:id/results ──────────────────────────────────────────
export function getDashboardResults(
  id: string,
  filters: DashboardFilters,
): Promise<BatchWidgetResults> {
  return withRead(() => {
    ensureSeeded();
    requireDashboard(id);
    const items = widgetsForDashboard(id).map((widget) =>
      computeWidgetResult(widget, filters),
    );
    return { items };
  });
}
