import type { DashboardFilters, ListParams } from "@/types";

/**
 * Centralized TanStack Query key factory. One source of truth for cache keys so invalidation
 * in mutation hooks stays consistent and typo-proof.
 */
export const queryKeys = {
  dashboards: {
    all: ["dashboards"] as const,
    list: (params?: ListParams) =>
      [...queryKeys.dashboards.all, "list", params ?? {}] as const,
    detail: (id: string) =>
      [...queryKeys.dashboards.all, "detail", id] as const,
    results: (id: string, filters: DashboardFilters) =>
      [...queryKeys.dashboards.all, "results", id, filters] as const,
  },
  charts: {
    all: ["charts"] as const,
    list: (params?: ListParams) =>
      [...queryKeys.charts.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.charts.all, "detail", id] as const,
    byIds: (ids: string[]) => [...queryKeys.charts.all, "byIds", ids] as const,
  },
} as const;
