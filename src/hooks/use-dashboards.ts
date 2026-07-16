"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getDashboard, listDashboards } from "@/services/dashboard.service";
import type { ListParams } from "@/types";

/** Flat dashboard listing (Epic 9: no folders in V1). */
export function useDashboards(params: ListParams = {}) {
  return useQuery({
    queryKey: queryKeys.dashboards.list(params),
    queryFn: () => listDashboards(params),
  });
}

/** Single dashboard by canonical id (the sharing URL). */
export function useDashboard(id: string) {
  return useQuery({
    queryKey: queryKeys.dashboards.detail(id),
    queryFn: () => getDashboard(id),
    enabled: Boolean(id),
  });
}
