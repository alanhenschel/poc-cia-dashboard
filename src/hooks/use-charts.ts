"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getChart, getChartsByIds, listCharts } from "@/services/chart.service";
import type { ListParams } from "@/types";

/** Chart listing / picker source. Excludes soft-deleted charts; reflects used_in_dashboards_count. */
export function useCharts(params: ListParams = {}) {
  return useQuery({
    queryKey: queryKeys.charts.list(params),
    queryFn: () => listCharts(params),
  });
}

export function useChart(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.charts.detail(id),
    queryFn: () => getChart(id),
    enabled: enabled && Boolean(id),
  });
}

/**
 * Resolve a set of charts by id (e.g. the charts a dashboard's widgets reference). Unlike the
 * paginated list, this never misses a chart because of page size or sort order.
 */
export function useChartsByIds(ids: string[]) {
  const sortedIds = [...new Set(ids)].sort();
  return useQuery({
    queryKey: queryKeys.charts.byIds(sortedIds),
    queryFn: () => getChartsByIds(sortedIds),
    enabled: sortedIds.length > 0,
  });
}
