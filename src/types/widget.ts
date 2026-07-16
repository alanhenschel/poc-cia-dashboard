/**
 * Widget aggregate. V1: only `type = "chart"` (RFC data model).
 * `position` maps 1:1 onto react-grid-layout's `{x,y,w,h}` LayoutItem.
 */

/** Discriminator. Widened post-V1 (markdown, kpi, cohort-counter, …) via the plugin model. */
export type WidgetType = "chart";

/** Grid position in grid units (not pixels). RFC: `{ "x": 0, "y": 0, "w": 6, "h": 4 }`. */
export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Widget as embedded in a Dashboard response (RFC Dashboard.widgets[]).
 * `chart_id` is the resolved reference for `type = "chart"`.
 */
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  chart_id: string;
  position: WidgetPosition;
}

/**
 * Standalone Widget response (POST/PATCH /api/dashboards/:id/widgets[/:wid]).
 * Carries `dashboard_id` and `created_at`, which the embedded form omits.
 */
export interface Widget extends DashboardWidget {
  dashboard_id: string;
  created_at: string;
}
