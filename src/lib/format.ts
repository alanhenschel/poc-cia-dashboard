import { formatDistanceToNowStrict } from "date-fns";

const numberFormatter = new Intl.NumberFormat("en-US");
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Full grouped number, e.g. 12453 → "12,453". */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Compact number for axis ticks / KPIs, e.g. 12453 → "12.5K". */
export function formatCompactNumber(value: number): string {
  return compactFormatter.format(value);
}

/** ISO timestamp → relative label, e.g. "3 hours ago". Returns "" for missing input. */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${formatDistanceToNowStrict(date)} ago`;
}

/** ISO timestamp → short axis label for time-series ticks, e.g. "May 22". */
export function formatAxisDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** ISO timestamp → tooltip label with time, e.g. "May 22, 14:00". */
export function formatTooltipDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
