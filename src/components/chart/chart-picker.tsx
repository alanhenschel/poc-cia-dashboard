"use client";

import { Check, Search } from "lucide-react";
import { useState } from "react";
import { ErrorState } from "@/components/common/error-state";
import { OwnerBadge } from "@/components/common/owner-badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useCharts } from "@/hooks/use-charts";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

interface ChartPickerProps {
  selectedId: string | null;
  onSelect: (chartId: string) => void;
}

/** Searchable single-select list of existing charts (reference-an-existing-chart flow). */
export function ChartPicker({ selectedId, onSelect }: ChartPickerProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const chartsQuery = useCharts({ search: debouncedSearch.trim() || undefined });

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search charts by name or owner"
          className="pl-8"
          aria-label="Search charts"
        />
      </div>

      {chartsQuery.isPending ? (
        <div className="grid gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : chartsQuery.isError ? (
        <ErrorState error={chartsQuery.error} onRetry={() => chartsQuery.refetch()} />
      ) : chartsQuery.data.items.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">No charts match your search.</p>
      ) : (
        <ScrollArea className="h-72 rounded-md border">
          <ul className="divide-y" role="listbox" aria-label="Charts">
            {chartsQuery.data.items.map((chart) => {
              const selected = chart.id === selectedId;
              return (
                <li key={chart.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => onSelect(chart.id)}
                    className={cn(
                      "hover:bg-accent flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      selected && "bg-accent",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{chart.name}</p>
                      <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                        <OwnerBadge ownerId={chart.owner_id} />
                        <span aria-hidden>·</span>
                        <span>Used in {chart.used_in_dashboards_count}</span>
                      </div>
                    </div>
                    {selected ? <Check className="text-primary size-4 shrink-0" aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}
