"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getDashboardResults } from "@/services/dashboard.service";
import type { DashboardFilters } from "@/types";

/**
 * Batch widget results for a dashboard (GET /api/dashboards/:id/results).
 * Polls on an interval so the `is_stale` / stale-while-revalidate transitions surface in the UI.
 * Re-keys on `filters` so changing the global filter recomputes results.
 */
export function useDashboardResults(
  dashboardId: string,
  filters: DashboardFilters | null,
) {
  return useQuery({
    queryKey: filters
      ? queryKeys.dashboards.results(dashboardId, filters)
      : [...queryKeys.dashboards.all, "results", dashboardId, "pending"],
    queryFn: () => getDashboardResults(dashboardId, filters as DashboardFilters),
    enabled: Boolean(dashboardId) && filters !== null,
    // Short freshness + polling makes the stale indicator observable without hammering the mock.
    staleTime: 10_000,
    refetchInterval: 20_000,
    // Keep previous results on-screen while a filter change refetches (no flash-to-skeleton).
    placeholderData: (previous) => previous,
  });
}
