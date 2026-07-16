"use client";

import "react-grid-layout/css/styles.css";
import {
  GridLayout,
  useContainerWidth,
  type Layout,
  type ResizeHandleAxis,
} from "react-grid-layout";
import type { ReactNode, Ref } from "react";
import {
  GRID_COLS,
  GRID_CONTAINER_PADDING,
  GRID_MARGIN,
  GRID_ROW_HEIGHT,
  WIDGET_DRAG_HANDLE_CLASS,
  WIDGET_MIN_H,
  WIDGET_MIN_W,
} from "@/constants/grid";
import type { DashboardWidget, WidgetPosition } from "@/types";

interface DashboardGridProps {
  widgets: DashboardWidget[];
  /** Draft `{x,y,w,h}` per widget id (from the editor store). */
  layout: Record<string, WidgetPosition>;
  editMode: boolean;
  /** Called only on a genuine user drag/resize (not on mount, add, or remove). */
  onCommitLayout: (layout: Record<string, WidgetPosition>) => void;
  renderWidget: (widget: DashboardWidget) => ReactNode;
}

function toLayoutRecord(layout: Layout): Record<string, WidgetPosition> {
  const record: Record<string, WidgetPosition> = {};
  for (const item of layout) {
    record[item.i] = { x: item.x, y: item.y, w: item.w, h: item.h };
  }
  return record;
}

/**
 * Pointer-only resize handle. react-grid-layout owns this element's mouse behavior but not any
 * keyboard binding, so making it a focusable `role="button"` would be a dead-end Tab stop. Keyboard
 * resize lives on the widget drag handle (Shift+Arrow) instead, so this stays out of the tab order and
 * is hidden from assistive tech (the drag handle's label already announces the keyboard resize path).
 */
function AccessibleResizeHandle(axis: ResizeHandleAxis, ref: Ref<HTMLElement>) {
  return (
    <span
      ref={ref as Ref<HTMLSpanElement>}
      className={`react-resizable-handle react-resizable-handle-${axis}`}
      aria-hidden
    />
  );
}

/**
 * Draggable/resizable widget grid (react-grid-layout v2). Positions bind 1:1 to the RFC
 * `Widget.position` `{x,y,w,h}`. Drag/resize is enabled only in edit mode; dragging is limited to
 * the widget header handle so chart interactions (hover/tooltip) still work. The layout is only
 * committed as a user edit on drag/resize STOP, so adding/removing widgets never marks it dirty.
 */
export function DashboardGrid({
  widgets,
  layout,
  editMode,
  onCommitLayout,
  renderWidget,
}: DashboardGridProps) {
  const { width, containerRef, mounted } = useContainerWidth();

  const layoutItems: Layout = widgets.map((widget) => {
    const position = layout[widget.id] ?? widget.position;
    return { i: widget.id, ...position, minW: WIDGET_MIN_W, minH: WIDGET_MIN_H };
  });

  const commit = (next: Layout) => {
    if (editMode) onCommitLayout(toLayoutRecord(next));
  };

  return (
    <div ref={containerRef} className="w-full">
      {mounted ? (
        <GridLayout
          width={width}
          layout={layoutItems}
          gridConfig={{
            cols: GRID_COLS,
            rowHeight: GRID_ROW_HEIGHT,
            margin: GRID_MARGIN,
            containerPadding: GRID_CONTAINER_PADDING,
          }}
          dragConfig={{ enabled: editMode, handle: `.${WIDGET_DRAG_HANDLE_CLASS}` }}
          resizeConfig={{
            enabled: editMode,
            handles: ["se"],
            handleComponent: AccessibleResizeHandle,
          }}
          onDragStop={commit}
          onResizeStop={commit}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>{renderWidget(widget)}</div>
          ))}
        </GridLayout>
      ) : null}
    </div>
  );
}
