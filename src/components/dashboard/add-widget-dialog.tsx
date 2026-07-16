"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ChartForm } from "@/components/forms/chart-form";
import { ChartPicker } from "@/components/chart/chart-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_WIDGET_SIZE } from "@/constants/grid";
import { useAddWidget } from "@/hooks/use-widget-mutations";
import { useCreateChart } from "@/hooks/use-chart-mutations";
import type { WidgetPosition } from "@/types";

interface AddWidgetDialogProps {
  dashboardId: string;
  /** Current on-screen positions (the live draft in edit mode) — so a new widget never lands on
   *  top of an unsaved, dragged position. */
  positions: WidgetPosition[];
}

/** Places a new widget below the existing ones so it never overlaps on add. */
function nextPosition(positions: WidgetPosition[]): WidgetPosition {
  const bottom = positions.reduce((max, p) => Math.max(max, p.y + p.h), 0);
  return { x: 0, y: bottom, ...DEFAULT_WIDGET_SIZE };
}

/** Add a chart widget to a dashboard: reference an existing chart, or create a new one inline. */
export function AddWidgetDialog({ dashboardId, positions }: AddWidgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);
  const addWidget = useAddWidget(dashboardId);
  const createChart = useCreateChart();

  const busy = addWidget.isPending || createChart.isPending;

  const close = () => {
    setOpen(false);
    setSelectedChartId(null);
  };

  const addExisting = () => {
    if (!selectedChartId) return;
    addWidget.mutate(
      { chart_id: selectedChartId, position: nextPosition(positions) },
      { onSuccess: close },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="size-4" aria-hidden />
          Add chart
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a chart</DialogTitle>
          <DialogDescription>
            Reference an existing chart, or create a new one and add it in one step.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="existing">
          <TabsList className="w-full">
            <TabsTrigger value="existing" className="flex-1">
              Existing chart
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1">
              New chart
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="mt-4">
            <ChartPicker selectedId={selectedChartId} onSelect={setSelectedChartId} />
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button onClick={addExisting} disabled={!selectedChartId || busy}>
                Add to dashboard
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="new" className="mt-4">
            <ChartForm
              submitLabel="Create & add"
              pending={busy}
              onCancel={close}
              onSubmit={(values) =>
                // Two-step: create the chart, then add it as a widget. TODO(real-backend): if the
                // second call fails after the first succeeds, the new chart is left orphaned (no
                // widget). Currently unreachable (WRITE_ERROR_RATE = 0); when a real backend can
                // fail mid-sequence, either delete the just-created chart on rollback or expose a
                // single transactional "create chart + attach" endpoint.
                createChart.mutate(values, {
                  onSuccess: (chart) =>
                    addWidget.mutate(
                      { chart_id: chart.id, position: nextPosition(positions) },
                      { onSuccess: close },
                    ),
                })
              }
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
