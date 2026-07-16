import type { VisualizationType } from "./chart";

/**
 * Widget result state model — the single contract the M2 frontend renders against (Epic 7).
 * The backend payload can be any of these six; `loading` and `network_error` are derived
 * client-side by TanStack Query and are NOT part of the wire payload.
 */
export type WidgetResultState =
  | "ok"
  | "stale"
  | "chart_unavailable"
  | "filter_conflict"
  | "rate_limited"
  | "forbidden";

/** One point in a time series. RFC: `{ "ts": "...", "value": 12453 }`. */
export interface WidgetPoint {
  ts: string;
  value: number;
}

/** One series (e.g. a platform breakdown). RFC: `{ "label": "iOS", "points": [...] }`. */
export interface WidgetSeries {
  label: string;
  points: WidgetPoint[];
}

/** The `data` block of a computed widget result (RFC Magnify Integration). */
export interface WidgetResultData {
  visualization_type: VisualizationType;
  unit: string;
  series: WidgetSeries[];
}

interface WidgetResultBase {
  widget_id: string;
  chart_id: string;
}

/**
 * `ok` / `stale`: the widget computed successfully. `is_stale=true` means the value is being
 * revalidated in the background (RFC stale-while-revalidate) — render the data plus an
 * "updating…" indicator.
 */
export interface WidgetResultOk extends WidgetResultBase {
  state: "ok" | "stale";
  query_hash: string;
  computed_at: string;
  ttl_expires_at: string;
  is_stale: boolean;
  source: "cache" | "magnify";
  data: WidgetResultData;
}

/** The referenced Chart is soft-deleted or missing (roadmap: chart delete = soft delete). */
export interface WidgetResultChartUnavailable extends WidgetResultBase {
  state: "chart_unavailable";
}

/** Chart-level AND dashboard-level filters intersect to an empty set (Epic 5 filter resolution). */
export interface WidgetResultFilterConflict extends WidgetResultBase {
  state: "filter_conflict";
}

/** Rate limit hit / circuit open. RFC returns 429 with Retry-After. */
export interface WidgetResultRateLimited extends WidgetResultBase {
  state: "rate_limited";
  retry_after_seconds: number;
}

/** Principal cannot read this widget's chart (defensive — reads are broad in V1). */
export interface WidgetResultForbidden extends WidgetResultBase {
  state: "forbidden";
}

/** Discriminated union over `state` — exhaustive-switchable in the renderer. */
export type WidgetResult =
  | WidgetResultOk
  | WidgetResultChartUnavailable
  | WidgetResultFilterConflict
  | WidgetResultRateLimited
  | WidgetResultForbidden;

/** Batch results (GET /api/dashboards/:id/results — Epic 3 primary path). */
export interface BatchWidgetResults {
  items: WidgetResult[];
}
