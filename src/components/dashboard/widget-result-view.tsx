"use client";

import { FilterX, Gauge, Lock, RotateCw, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";
import type { WidgetResult } from "@/types";
import { ChartRenderer } from "@/components/chart/chart-renderer";
import { WidgetMessage } from "./widget-message";

interface WidgetResultViewProps {
  result: WidgetResult | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}

function LoadingBody() {
  return (
    <div className="flex h-full flex-col justify-end gap-2 p-4" aria-busy>
      <span className="sr-only">Loading widget…</span>
      <div className="flex flex-1 items-end gap-2">
        {[60, 80, 45, 92, 70, 55, 84].map((h, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
        ))}
      </div>
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

/**
 * Renders every widget result state (Epic 7 enum) plus the client-derived loading / network-error
 * states. The `switch` is exhaustive over `result.state`, so a new backend state is a compile error
 * here until it's handled.
 */
export function WidgetResultView({ result, isLoading, error, onRetry }: WidgetResultViewProps) {
  // Client-derived states first: a pending first load, then a hard network failure.
  if (isLoading && !result) return <LoadingBody />;

  if (error && !result) {
    return (
      <WidgetMessage
        icon={RotateCw}
        tone="danger"
        title="Couldn't load"
        description={getErrorMessage(error)}
        action={
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCw className="size-3.5" aria-hidden />
            Retry
          </Button>
        }
      />
    );
  }

  if (!result) return <LoadingBody />;

  switch (result.state) {
    case "ok":
    case "stale":
      return (
        <div className="h-full p-3 pt-1">
          <ChartRenderer data={result.data} />
        </div>
      );

    case "chart_unavailable":
      return (
        <WidgetMessage
          icon={Unlink}
          title="Chart unavailable"
          description="The chart this widget points to was deleted or is no longer accessible."
        />
      );

    case "filter_conflict":
      return (
        <WidgetMessage
          icon={FilterX}
          tone="warning"
          title="No data for these filters"
          description="The dashboard filter and this chart's own filters don't overlap."
        />
      );

    case "rate_limited":
      return (
        <WidgetMessage
          icon={Gauge}
          tone="warning"
          title="Rate limited"
          description={`Query budget reached. Retry in about ${result.retry_after_seconds}s.`}
          action={
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCw className="size-3.5" aria-hidden />
              Retry now
            </Button>
          }
        />
      );

    case "forbidden":
      return (
        <WidgetMessage
          icon={Lock}
          tone="danger"
          title="No access"
          description="You don't have permission to view this chart's data."
        />
      );

    default: {
      // Exhaustiveness guard — unreachable while the union is fully handled above.
      const _exhaustive: never = result;
      return _exhaustive;
    }
  }
}
