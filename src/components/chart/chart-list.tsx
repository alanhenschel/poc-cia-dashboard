"use client";

import { BarChart3, Search } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCharts } from "@/hooks/use-charts";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ChartListCard } from "./chart-list-card";
import { CreateChartDialog } from "./create-chart-dialog";

function ListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-40 rounded-xl" />
      ))}
    </div>
  );
}

/** Chart listing with client-side search. Soft-deleted charts are excluded server-side. */
export function ChartList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const query = useCharts({ search: debouncedSearch.trim() || undefined });

  return (
    <div className="grid gap-5">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search charts"
          className="pl-8"
          aria-label="Search charts"
        />
      </div>

      {query.isPending ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={debouncedSearch ? "No matching charts" : "No charts yet"}
          description={
            debouncedSearch
              ? "Try a different name or owner."
              : "Create a reusable chart to add to your dashboards."
          }
          action={debouncedSearch ? undefined : <CreateChartDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.items.map((chart) => (
            <ChartListCard key={chart.id} chart={chart} />
          ))}
        </div>
      )}
    </div>
  );
}
