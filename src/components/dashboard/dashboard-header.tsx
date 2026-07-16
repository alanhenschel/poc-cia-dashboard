"use client";

import { MoreHorizontal, Pencil, PencilRuler, Trash2 } from "lucide-react";
import { useState } from "react";
import { CopyLinkButton } from "@/components/common/copy-link-button";
import { OwnerBadge } from "@/components/common/owner-badge";
import { TagList } from "@/components/common/tag-list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/format";
import type { Dashboard } from "@/types";
import { DeleteDashboardDialog } from "./delete-dashboard-dialog";
import { EditDashboardDialog } from "./edit-dashboard-dialog";

interface DashboardHeaderProps {
  dashboard: Dashboard;
  editMode: boolean;
  onToggleEdit: () => void;
}

/** Dashboard title row: identity + sharing + owner-only edit/manage actions. */
export function DashboardHeader({ dashboard, editMode, onToggleEdit }: DashboardHeaderProps) {
  const [editingDetails, setEditingDetails] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const canMutate = dashboard.can_mutate;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <h1 className="truncate text-2xl font-semibold tracking-tight">{dashboard.name}</h1>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <OwnerBadge ownerId={dashboard.owner_id} />
          <span aria-hidden>·</span>
          <span>Updated {formatRelativeTime(dashboard.updated_at)}</span>
          {!canMutate ? (
            <span className="bg-muted rounded px-1.5 py-0.5 text-xs">View only</span>
          ) : null}
        </div>
        <TagList tags={dashboard.tags} />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <CopyLinkButton label="Share" />

        {canMutate ? (
          <>
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={onToggleEdit}
              aria-pressed={editMode}
            >
              <PencilRuler className="size-4" aria-hidden />
              {editMode ? "Done editing" : "Edit layout"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Dashboard actions">
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingDetails(true)}>
                  <Pencil className="size-4" aria-hidden />
                  Edit details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmingDelete(true)}>
                  <Trash2 className="size-4" aria-hidden />
                  Delete dashboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <EditDashboardDialog
              dashboard={dashboard}
              open={editingDetails}
              onOpenChange={setEditingDetails}
            />
            <DeleteDashboardDialog
              dashboardId={dashboard.id}
              dashboardName={dashboard.name}
              open={confirmingDelete}
              onOpenChange={setConfirmingDelete}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
