import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { OwnerBadge } from "@/components/common/owner-badge";
import { TagList } from "@/components/common/tag-list";
import { formatRelativeTime } from "@/lib/format";
import type { DashboardListItem } from "@/types";

/** One dashboard in the flat listing. The whole card links to the canonical dashboard URL. */
export function DashboardListCard({ dashboard }: { dashboard: DashboardListItem }) {
  return (
    <Link
      href={`/dashboards/${dashboard.id}`}
      className="group bg-card hover:border-ring/50 focus-visible:ring-ring/50 flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition-colors outline-none focus-visible:ring-[3px]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold group-hover:underline">{dashboard.name}</h3>
        <span className="text-muted-foreground inline-flex shrink-0 items-center gap-1 text-xs">
          <LayoutGrid className="size-3.5" aria-hidden />
          {dashboard.widget_count}
        </span>
      </div>

      <TagList tags={dashboard.tags} />

      <div className="text-muted-foreground mt-auto flex items-center justify-between gap-2 pt-1 text-xs">
        <OwnerBadge ownerId={dashboard.owner_id} />
        <span>Updated {formatRelativeTime(dashboard.updated_at)}</span>
      </div>
    </Link>
  );
}
