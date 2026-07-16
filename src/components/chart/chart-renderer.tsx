"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisDate, formatCompactNumber, formatNumber, formatTooltipDate } from "@/lib/format";
import type { WidgetResultData } from "@/types";

/** Validated categorical series roles (see globals.css / dataviz reference palette). */
const SERIES_COLORS = [
  "var(--viz-series-1)",
  "var(--viz-series-2)",
  "var(--viz-series-3)",
  "var(--viz-series-4)",
  "var(--viz-series-5)",
  "var(--viz-series-6)",
];

interface ChartRendererProps {
  data: WidgetResultData;
}

interface MergedRow {
  ts: string;
  [seriesLabel: string]: string | number;
}

/** Pivot series[].points[] into Recharts' row-per-timestamp shape, keyed by series label. */
function mergeSeries(data: WidgetResultData): MergedRow[] {
  const byTs = new Map<string, MergedRow>();
  for (const series of data.series) {
    for (const point of series.points) {
      const row = byTs.get(point.ts) ?? { ts: point.ts };
      row[series.label] = point.value;
      byTs.set(point.ts, row);
    }
  }
  return [...byTs.values()].sort((a, b) => (a.ts < b.ts ? -1 : 1));
}

function TooltipContent({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{formatTooltipDate(label ?? "")}</p>
      <ul className="space-y-0.5">
        {payload.map((entry) => (
          <li key={entry.name} className="flex items-center gap-2 tabular-nums">
            <span className="size-2 rounded-full" style={{ background: entry.color }} aria-hidden />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium">{formatNumber(entry.value ?? 0)}</span>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-1">{unit.replace(/_/g, " ")}</p>
    </div>
  );
}

/**
 * Renders a computed widget result. Branches on `visualization_type` so bar/area extend without
 * re-architecting (mirrors the backend's viz-type branching in Epic 5). V1 data is `line`.
 */
export function ChartRenderer({ data }: ChartRendererProps) {
  const rows = useMemo(() => mergeSeries(data), [data]);
  const labels = data.series.map((s) => s.label);
  const showLegend = labels.length > 1;

  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
      <XAxis
        dataKey="ts"
        tickFormatter={formatAxisDate}
        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        tickLine={false}
        axisLine={false}
        minTickGap={24}
      />
      <YAxis
        tickFormatter={formatCompactNumber}
        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        tickLine={false}
        axisLine={false}
        width={44}
      />
      <Tooltip
        content={<TooltipContent unit={data.unit} />}
        cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
      />
      {showLegend ? (
        <Legend
          iconType="plainline"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
      ) : null}
    </>
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      {data.visualization_type === "bar" ? (
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          {axes}
          {labels.map((label, i) => (
            <Bar key={label} dataKey={label} fill={SERIES_COLORS[i % SERIES_COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      ) : data.visualization_type === "area" ? (
        <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          {axes}
          {labels.map((label, i) => (
            <Area
              key={label}
              dataKey={label}
              stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
              fill={SERIES_COLORS[i % SERIES_COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      ) : (
        <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          {axes}
          {labels.map((label, i) => (
            <Line
              key={label}
              type="monotone"
              dataKey={label}
              stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
