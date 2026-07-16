"use client";

import { ChartForm } from "@/components/forms/chart-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/error-state";
import { useChart } from "@/hooks/use-charts";
import { useUpdateChart } from "@/hooks/use-chart-mutations";

interface EditChartDialogProps {
  chartId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Edit a chart the current user owns. Loads the full query_definition lazily when opened. */
export function EditChartDialog({ chartId, open, onOpenChange }: EditChartDialogProps) {
  const chartQuery = useChart(chartId, open);
  const updateChart = useUpdateChart(chartId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit chart</DialogTitle>
          <DialogDescription>Changes apply everywhere this chart is used.</DialogDescription>
        </DialogHeader>

        {chartQuery.isPending ? (
          <div className="grid gap-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-48" />
          </div>
        ) : chartQuery.isError ? (
          <ErrorState error={chartQuery.error} onRetry={() => chartQuery.refetch()} />
        ) : (
          <ChartForm
            submitLabel="Save changes"
            pending={updateChart.isPending}
            onCancel={() => onOpenChange(false)}
            defaultValues={{
              name: chartQuery.data.name,
              visualization_type: chartQuery.data.visualization_type,
              query_definition: chartQuery.data.query_definition,
            }}
            onSubmit={(values) =>
              updateChart.mutate(values, { onSuccess: () => onOpenChange(false) })
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
