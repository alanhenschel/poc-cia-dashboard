"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardForm } from "@/components/forms/dashboard-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateDashboard } from "@/hooks/use-dashboard-mutations";

/** "New dashboard" entry point. On success, routes to the new dashboard's canonical URL. */
export function CreateDashboardDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const createDashboard = useCreateDashboard();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden />
          New dashboard
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create dashboard</DialogTitle>
          <DialogDescription>
            Give it a name and optional tags. You can add charts and set filters next.
          </DialogDescription>
        </DialogHeader>
        <DashboardForm
          submitLabel="Create dashboard"
          pending={createDashboard.isPending}
          onCancel={() => setOpen(false)}
          onSubmit={(values) =>
            createDashboard.mutate(values, {
              onSuccess: (dashboard) => {
                setOpen(false);
                router.push(`/dashboards/${dashboard.id}`);
              },
            })
          }
        />
      </DialogContent>
    </Dialog>
  );
}
