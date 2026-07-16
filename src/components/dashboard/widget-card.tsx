"use client";

import { Copy, GripVertical, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WIDGET_DRAG_HANDLE_CLASS } from "@/constants/grid";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DashboardWidget, WidgetResult } from "@/types";
import { WidgetResultView } from "./widget-result-view";

interface WidgetCardProps {
  widget: DashboardWidget;
  /** Resolved chart name (by id), or undefined when the chart is deleted/missing. */
  chartName?: string;
  /** True while the by-id chart lookup is still loading — avoids a false "Unavailable" flash. */
  chartNamePending: boolean;
  result: WidgetResult | undefined;
  isLoading: boolean;
  error: unknown;
  editMode: boolean;
  copyPending: boolean;
  onRetry: () => void;
  onRemove: () => void;
  onCopyChart: (chartId: string) => void;
  /** Keyboard grid ops (edit mode): 1 grid unit per arrow key press. */
  onMove: (dx: number, dy: number) => void;
  onResize: (dw: number, dh: number) => void;
}

const ARROW_DELTAS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** One dashboard widget: titled frame + result body. Drag handle + remove appear in edit mode. */
export function WidgetCard({
  widget,
  chartName,
  chartNamePending,
  result,
  isLoading,
  error,
  editMode,
  copyPending,
  onRetry,
  onRemove,
  onCopyChart,
  onMove,
  onResize,
}: WidgetCardProps) {
  const isStale = result?.state === "stale";
  // A deleted/missing chart is definitively unavailable (the result state says so); only fall back to
  // the "Unavailable" label once the name lookup has actually settled, otherwise show a loading title.
  const definitelyUnavailable = result?.state === "chart_unavailable";
  const showTitleSkeleton = !chartName && !definitelyUnavailable && chartNamePending;
  const title = chartName ?? "Unavailable chart";
  const chartAvailable = Boolean(chartName) && !definitelyUnavailable;

  const onHandleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const delta = ARROW_DELTAS[event.key];
    if (!delta) return;
    event.preventDefault();
    if (event.shiftKey) onResize(delta[0], delta[1]);
    else onMove(delta[0], delta[1]);
  };

  return (
    <div className="bg-card text-card-foreground flex h-full flex-col overflow-hidden rounded-xl border shadow-sm">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        {editMode ? (
          <button
            type="button"
            aria-label="Reposition widget. Arrow keys move it; Shift with arrow keys resizes it."
            onKeyDown={onHandleKeyDown}
            className={cn(
              WIDGET_DRAG_HANDLE_CLASS,
              "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 -ml-1 cursor-grab touch-none rounded p-0.5 focus-visible:ring-[3px] focus-visible:outline-none active:cursor-grabbing",
            )}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        ) : null}

        {showTitleSkeleton ? (
          <Skeleton className="h-4 w-32" aria-label="Loading chart" />
        ) : (
          <h3 className="truncate text-sm font-medium" title={title}>
            {title}
          </h3>
        )}

        {isStale ? (
          <span className="text-muted-foreground ml-1 inline-flex items-center gap-1 text-[11px]">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            Updating…
          </span>
        ) : null}

        <div className="ml-auto flex items-center">
          {editMode ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-7"
              onClick={onRemove}
              aria-label="Remove widget"
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          ) : chartAvailable ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" aria-label="Widget actions">
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onCopyChart(widget.chart_id)}
                  disabled={copyPending}
                >
                  <Copy className="size-4" aria-hidden />
                  Copy chart to my charts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <WidgetResultView
          result={result}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
        />
      </div>
    </div>
  );
}
