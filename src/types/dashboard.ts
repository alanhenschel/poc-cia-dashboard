import type { DashboardFilters } from "./filters";
import type { DashboardWidget } from "./widget";

/**
 * Dashboard aggregate (GET /api/dashboards/:id, and POST/PATCH responses).
 * Named container; `filters` is the single global filter applied to every widget.
 */
export interface Dashboard {
  id: string;
  name: string;
  owner_id: string;
  /** Backend-computed: does the principal own (or admin-govern) this dashboard? */
  can_mutate: boolean;
  tags: string[];
  filters: DashboardFilters;
  widgets: DashboardWidget[];
  created_at: string;
  updated_at: string;
}

/**
 * Dashboard list item (GET /api/dashboards). Carries the denormalized `widget_count`
 * counter (RFC), not the full widget array.
 */
export interface DashboardListItem {
  id: string;
  name: string;
  owner_id: string;
  can_mutate: boolean;
  widget_count: number;
  tags: string[];
  updated_at: string;
}
