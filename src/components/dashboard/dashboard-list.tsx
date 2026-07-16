"use client";

import { LayoutDashboard, Search } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboards } from "@/hooks/use-dashboards";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CreateDashboardDialog } from "./create-dashboard-dialog";
import { DashboardListCard } from "./dashboard-list-card";

function ListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}

/** Flat dashboard listing with client-side search (by name / owner / tag). */
export function DashboardList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const query = useDashboards({ search: debouncedSearch.trim() || undefined });

  return (
    <div className="grid gap-5">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search dashboards"
          className="pl-8"
          aria-label="Search dashboards"
        />
      </div>

      {query.isPending ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          title={debouncedSearch ? "No matching dashboards" : "No dashboards yet"}
          description={
            debouncedSearch
              ? "Try a different name, owner, or tag."
              : "Create your first dashboard to start composing charts on a shared canvas."
          }
          action={debouncedSearch ? undefined : <CreateDashboardDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.items.map((dashboard) => (
            <DashboardListCard key={dashboard.id} dashboard={dashboard} />
          ))}
        </div>
      )}
    </div>
  );
}
