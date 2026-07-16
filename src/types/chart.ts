/**
 * Chart aggregate. Standalone, reusable across dashboards (RFC data model + Chart response shape).
 */

/**
 * Visualization type. V1 ships `line` only (RFC: "V1 only implements line"), but the union is
 * declared wider so the Recharts renderer can branch on it without re-architecting (Epic 5 note).
 */
export type VisualizationType = "line" | "bar" | "area";

/** Comparison operators for a query-definition property filter (RFC example uses "eq"). */
export type QueryFilterOp = "eq" | "neq" | "in" | "contains";

export interface QueryFilter {
  property: string;
  op: QueryFilterOp;
  value: string;
}

/**
 * The chart's query definition (RFC Chart response). Translated backend-side into Magnify
 * `template_params`; the frontend only edits/persists this declarative shape.
 */
export interface QueryDefinition {
  metric: string;
  measurement: string;
  filters: QueryFilter[];
  group_by: string[];
}

/** Chart (GET /api/charts/:id, and POST/PATCH/copy responses). */
export interface Chart {
  id: string;
  name: string;
  owner_id: string;
  /** True when the principal owns the chart — backend-computed, never recomputed client-side. */
  can_mutate: boolean;
  visualization_type: VisualizationType;
  query_definition: QueryDefinition;
  created_at: string;
  updated_at: string;
}

/**
 * Chart list item (GET /api/charts). Same shape as the dashboard list item, with
 * `used_in_dashboards_count` in place of `widget_count` (RFC).
 */
export interface ChartListItem {
  id: string;
  name: string;
  owner_id: string;
  can_mutate: boolean;
  used_in_dashboards_count: number;
  visualization_type: VisualizationType;
  updated_at: string;
}
