"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import {
  addWidget,
  deleteWidget,
  updateWidgetLayout,
  type AddWidgetInput,
  type WidgetLayoutPatch,
} from "@/services/dashboard.service";

/** Add a widget (new inline chart or existing chart reference) to a dashboard. */
export function useAddWidget(dashboardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddWidgetInput) => addWidget(dashboardId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.charts.all });
      toast.success("Widget added");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteWidget(dashboardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (widgetId: string) => deleteWidget(dashboardId, widgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.charts.all });
      toast.success("Widget removed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/** Persist the whole grid layout in one round trip after a drag/resize edit session. */
export function useSaveLayout(dashboardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patches: WidgetLayoutPatch[]) =>
      updateWidgetLayout(dashboardId, patches),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboards.detail(dashboardId),
      });
      toast.success("Layout saved");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
