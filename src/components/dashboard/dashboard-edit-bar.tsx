"use client";

import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WidgetPosition } from "@/types";
import { AddWidgetDialog } from "./add-widget-dialog";

interface DashboardEditBarProps {
  dashboardId: string;
  positions: WidgetPosition[];
  layoutDirty: boolean;
  savePending: boolean;
  onSaveLayout: () => void;
}

/** Edit-mode toolbar: add widgets, and persist the grid layout when it has unsaved changes. */
export function DashboardEditBar({
  dashboardId,
  positions,
  layoutDirty,
  savePending,
  onSaveLayout,
}: DashboardEditBarProps) {
  return (
    <div className="border-primary/30 bg-primary/5 flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-3">
      <span className="text-sm font-medium">Editing layout</span>
      <span className="text-muted-foreground text-xs">
        Drag a widget by its handle, or resize from the bottom-right corner.
      </span>

      <div className="ml-auto flex items-center gap-2">
        {layoutDirty ? (
          <span className="text-muted-foreground text-xs">Unsaved changes</span>
        ) : null}
        <AddWidgetDialog dashboardId={dashboardId} positions={positions} />
        <Button size="sm" onClick={onSaveLayout} disabled={!layoutDirty || savePending}>
          {savePending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
          Save layout
        </Button>
      </div>
    </div>
  );
}
