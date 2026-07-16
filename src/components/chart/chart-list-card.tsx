"use client";

import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { OwnerBadge } from "@/components/common/owner-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCopyChart, useDeleteChart } from "@/hooks/use-chart-mutations";
import { formatRelativeTime } from "@/lib/format";
import type { ChartListItem } from "@/types";
import { EditChartDialog } from "./edit-chart-dialog";

/** One chart in the listing. Owner sees edit/copy/delete; everyone can copy (fork-on-edit). */
export function ChartListCard({ chart }: { chart: ChartListItem }) {
  const [editing, setEditing] = useState(false);
  const copyChart = useCopyChart();
  const deleteChart = useDeleteChart();

  return (
    <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold" title={chart.name}>
            {chart.name}
          </h3>
          <Badge variant="outline" className="mt-1 font-normal capitalize">
            {chart.visualization_type}
          </Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7" aria-label={`Actions for ${chart.name}`}>
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => copyChart.mutate(chart.id)}
              disabled={copyChart.isPending}
            >
              <Copy className="size-4" aria-hidden />
              Copy {chart.can_mutate ? "" : "to my charts"}
            </DropdownMenuItem>
            {chart.can_mutate ? (
              <>
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil className="size-4" aria-hidden />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => deleteChart.mutate(chart.id)}
                  disabled={deleteChart.isPending}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Delete
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-muted-foreground mt-auto flex items-center justify-between gap-2 pt-1 text-xs">
        <OwnerBadge ownerId={chart.owner_id} />
        <span>Used in {chart.used_in_dashboards_count}</span>
      </div>
      <p className="text-muted-foreground text-xs">Updated {formatRelativeTime(chart.updated_at)}</p>

      {chart.can_mutate ? (
        <EditChartDialog chartId={chart.id} open={editing} onOpenChange={setEditing} />
      ) : null}
    </div>
  );
}
