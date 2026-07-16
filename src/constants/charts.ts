import type {
  QueryFilterOp,
  VisualizationType,
} from "@/types";

/** V1 ships `line`; `bar`/`area` are declared for the renderer's future branching (Epic 5). */
export const VISUALIZATION_TYPES: ReadonlyArray<{
  value: VisualizationType;
  label: string;
}> = [
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "area", label: "Area" },
];

/**
 * Clickstream metrics the standalone Charts feature exposes today (event names against Pinot).
 * Kept as a curated list so the create-chart form is a picker, not a free-text field.
 */
export const METRICS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "screen_viewed", label: "Screen viewed" },
  { value: "button_tapped", label: "Button tapped" },
  { value: "app_opened", label: "App opened" },
  { value: "transaction_completed", label: "Transaction completed" },
];

/** Measurement rule (maps backend-side to a Magnify `measurement_rule`, e.g. COUNT DISTINCT). */
export const MEASUREMENTS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "unique_customers", label: "Unique customers" },
  { value: "event_count", label: "Event count" },
  { value: "sessions", label: "Sessions" },
];

/** Dimensions available for `group_by` (the series split). */
export const GROUP_BY_DIMENSIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "platform", label: "Platform" },
  { value: "country", label: "Country" },
  { value: "app_version", label: "App version" },
];

export const FILTER_OPS: ReadonlyArray<{ value: QueryFilterOp; label: string }> =
  [
    { value: "eq", label: "equals" },
    { value: "neq", label: "not equals" },
    { value: "in", label: "in" },
    { value: "contains", label: "contains" },
  ];
