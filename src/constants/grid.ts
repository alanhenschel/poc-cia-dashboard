import type { WidgetPosition } from "@/types";

/**
 * react-grid-layout geometry. `cols` matches the RFC's 12-column mental model
 * (example widget is `w: 6` = half width).
 */
export const GRID_COLS = 12;
export const GRID_ROW_HEIGHT = 72;
export const GRID_MARGIN: [number, number] = [16, 16];
export const GRID_CONTAINER_PADDING: [number, number] = [0, 0];

/** Minimum widget footprint so a chart never collapses to an unreadable size. */
export const WIDGET_MIN_W = 3;
export const WIDGET_MIN_H = 3;

/** Default footprint for a freshly added widget (half width, RFC example height). */
export const DEFAULT_WIDGET_SIZE: Pick<WidgetPosition, "w" | "h"> = {
  w: 6,
  h: 4,
};

/** CSS selector react-grid-layout uses to know which element starts a drag (edit mode only). */
export const WIDGET_DRAG_HANDLE_CLASS = "widget-drag-handle";
