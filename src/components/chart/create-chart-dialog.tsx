"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ChartForm } from "@/components/forms/chart-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateChart } from "@/hooks/use-chart-mutations";

/** "New chart" entry point on the Charts page. */
export function CreateChartDialog() {
  const [open, setOpen] = useState(false);
  const createChart = useCreateChart();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden />
          New chart
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create chart</DialogTitle>
          <DialogDescription>
            Define a reusable chart. It can be added to any dashboard.
          </DialogDescription>
        </DialogHeader>
        <ChartForm
          submitLabel="Create chart"
          pending={createChart.isPending}
          onCancel={() => setOpen(false)}
          onSubmit={(values) =>
            createChart.mutate(values, { onSuccess: () => setOpen(false) })
          }
        />
      </DialogContent>
    </Dialog>
  );
}
