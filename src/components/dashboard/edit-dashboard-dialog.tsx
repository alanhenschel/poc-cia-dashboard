"use client";

import { DashboardForm } from "@/components/forms/dashboard-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateDashboard } from "@/hooks/use-dashboard-mutations";
import type { Dashboard } from "@/types";

interface EditDashboardDialogProps {
  dashboard: Dashboard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Rename / re-tag an existing dashboard. */
export function EditDashboardDialog({ dashboard, open, onOpenChange }: EditDashboardDialogProps) {
  const updateDashboard = useUpdateDashboard(dashboard.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dashboard details</DialogTitle>
          <DialogDescription>Update the name and tags.</DialogDescription>
        </DialogHeader>
        <DashboardForm
          submitLabel="Save changes"
          pending={updateDashboard.isPending}
          defaultValues={{ name: dashboard.name, tags: dashboard.tags }}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) =>
            updateDashboard.mutate(values, { onSuccess: () => onOpenChange(false) })
          }
        />
      </DialogContent>
    </Dialog>
  );
}
