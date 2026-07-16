"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import {
  copyChart,
  createChart,
  deleteChart,
  updateChart,
  type CreateChartInput,
  type UpdateChartInput,
} from "@/services/chart.service";

/** Invalidate every surface a chart change can touch: chart lists, dashboards, and widget results. */
function invalidateChartSurfaces(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.charts.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
}

export function useCreateChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChartInput) => createChart(input),
    onSuccess: (chart) => {
      invalidateChartSurfaces(queryClient);
      toast.success(`Created chart "${chart.name}"`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateChart(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateChartInput) => updateChart(id, patch),
    onSuccess: () => {
      invalidateChartSurfaces(queryClient);
      toast.success("Chart updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteChart(id),
    onSuccess: () => {
      invalidateChartSurfaces(queryClient);
      // Soft delete: widgets referencing this chart will now render "chart unavailable".
      toast.success("Chart deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/** Fork-on-edit: caller becomes owner of the clone (RFC POST /api/charts/:id/copy). */
export function useCopyChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => copyChart(id),
    onSuccess: (chart) => {
      invalidateChartSurfaces(queryClient);
      toast.success(`Copied to "${chart.name}" — you own this copy`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
