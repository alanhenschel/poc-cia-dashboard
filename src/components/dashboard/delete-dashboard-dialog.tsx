"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteDashboard } from "@/hooks/use-dashboard-mutations";

interface DeleteDashboardDialogProps {
  dashboardId: string;
  dashboardName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Confirmation before deleting a dashboard (destructive; returns to the listing on success). */
export function DeleteDashboardDialog({
  dashboardId,
  dashboardName,
  open,
  onOpenChange,
}: DeleteDashboardDialogProps) {
  const router = useRouter();
  const deleteDashboard = useDeleteDashboard();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete dashboard</DialogTitle>
          <DialogDescription>
            {`"${dashboardName}" will be permanently deleted. The charts it uses are not affected.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteDashboard.isPending}
            onClick={() =>
              deleteDashboard.mutate(dashboardId, {
                onSuccess: () => {
                  onOpenChange(false);
                  router.push("/dashboards");
                },
              })
            }
          >
            {deleteDashboard.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Delete dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
