"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import {
  createDashboard,
  deleteDashboard,
  updateDashboard,
  type CreateDashboardInput,
  type UpdateDashboardInput,
} from "@/services/dashboard.service";

export function useCreateDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDashboardInput) => createDashboard(input),
    onSuccess: (dashboard) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
      toast.success(`Created "${dashboard.name}"`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateDashboard(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateDashboardInput) => updateDashboard(id, patch),
    onSuccess: (dashboard) => {
      queryClient.setQueryData(queryKeys.dashboards.detail(id), dashboard);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
      toast.success("Dashboard updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDashboard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
      toast.success("Dashboard deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
