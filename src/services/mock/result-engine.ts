import type {
  Country,
  DashboardFilters,
  Platform,
  WidgetResult,
  WidgetResultData,
  WidgetSeries,
} from "@/types";
import { FRESH_WINDOW_MS, RATE_LIMIT_RETRY_SECONDS, REVALIDATE_MS } from "./config";
import {
  store,
  type ChartRecord,
  type WidgetRecord,
  type WidgetRuntime,
} from "./store";

// ── Deterministic pseudo-random data ─────────────────────────────────────────

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small, fast, seedable PRNG so the same chart+series always renders the same curve. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Granularity {
  count: number;
  stepMs: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function granularityFor(preset: DashboardFilters["date_range"]["preset"]): Granularity {
  switch (preset) {
    case "last_1h":
      return { count: 12, stepMs: 5 * MINUTE };
    case "last_24h":
      return { count: 24, stepMs: HOUR };
    case "last_7d":
      return { count: 7, stepMs: DAY };
    case "last_30d":
      return { count: 30, stepMs: DAY };
    case "last_90d":
      return { count: 13, stepMs: 7 * DAY };
    default:
      return { count: 7, stepMs: DAY };
  }
}

/** Canonical display labels for each dimension value. */
const PLATFORM_LABELS: Record<Platform, string> = { ios: "iOS", android: "Android" };
const PLATFORM_ORDER: Platform[] = ["ios", "android"];
const COUNTRY_LABELS: Record<Country, string> = {
  br: "Brazil",
  mx: "Mexico",
  co: "Colombia",
  us: "United States",
};
const COUNTRY_ORDER: Country[] = ["br", "mx", "co", "us"];
const APP_VERSION_LABELS = ["5.42.0", "5.43.0"];

/** Numeric compare of "5.42.0"-style version strings. Returns <0, 0, or >0. */
function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Series split for a widget. Mirrors the backend normalization step: a real Pinot query applies the
 * dashboard's WHERE filter BEFORE grouping, so groups outside the filter never come back. Hence the
 * label set is narrowed by the active `filters` — a country-grouped chart filtered to `country=br`
 * returns only the Brazil series, not all countries.
 */
function seriesLabels(chart: ChartRecord, filters: DashboardFilters): string[] {
  const dimension = chart.query_definition.group_by[0];
  switch (dimension) {
    case "platform": {
      // Only the selected platform(s); empty filter = both. Canonical order preserved.
      const selected = filters.platform.length > 0 ? filters.platform : PLATFORM_ORDER;
      return PLATFORM_ORDER.filter((p) => selected.includes(p)).map((p) => PLATFORM_LABELS[p]);
    }
    case "country": {
      // A single country filter collapses to that one group; unfiltered returns all four.
      const countries = filters.country ? [filters.country] : COUNTRY_ORDER;
      return countries.map((c) => COUNTRY_LABELS[c]);
    }
    case "app_version": {
      // Only versions at or above the minimum floor survive the filter.
      return filters.app_version_min
        ? APP_VERSION_LABELS.filter((v) => compareVersions(v, filters.app_version_min!) >= 0)
        : APP_VERSION_LABELS;
    }
    default:
      return ["Total"];
  }
}

/** Baseline magnitude by measurement, so unique_customers/event_count/sessions look distinct. */
function baseMagnitude(measurement: string): number {
  switch (measurement) {
    case "event_count":
      return 42_000;
    case "sessions":
      return 8_500;
    default:
      return 12_000;
  }
}

/** Rough share of total volume attributable to each country (sums to ~1). */
const COUNTRY_SHARE: Record<Country, number> = {
  br: 0.45,
  mx: 0.25,
  us: 0.18,
  co: 0.12,
};

/**
 * A newer minimum app version excludes users on older builds → less volume. Deterministic from the
 * version string and always < 1, so raising `app_version_min` believably trims magnitude.
 */
function appVersionScale(version: string): number {
  return 0.55 + (hashString(version) % 1000) / 1000 * 0.35; // 0.55 .. 0.90
}

/**
 * Volume multiplier for the active filters — mirrors how a WHERE-narrowed Pinot query returns a
 * SMALLER aggregate than the unfiltered total. Narrowing platform/country/app-version each scales the
 * magnitude down; the empty/"all" selection leaves it at 1.0.
 */
function filterScale(filters: DashboardFilters): number {
  let scale = 1;
  // Platform: empty = all platforms (1.0); each selected platform is roughly half the audience.
  if (filters.platform.length > 0) {
    scale *= Math.min(1, 0.55 * filters.platform.length);
  }
  // Country: a single country is a slice of global volume.
  if (filters.country) {
    scale *= COUNTRY_SHARE[filters.country] ?? 0.3;
  }
  // App-version floor: trims users on older builds.
  if (filters.app_version_min) {
    scale *= appVersionScale(filters.app_version_min);
  }
  return scale;
}

/**
 * Stable, order-independent seed fragment capturing EVERY filter dimension — so each distinct filter
 * combination produces its own curve shape (not just a scaled version of the same one).
 */
function filterKey(filters: DashboardFilters): string {
  return [
    filters.date_range.preset,
    [...filters.platform].sort().join("+") || "all",
    filters.country ?? "all",
    filters.app_version_min ?? "any",
  ].join("|");
}

/**
 * Generates a widget's series. Exported for unit testing. All four filter dimensions influence the
 * output: `date_range` sets the time granularity, and platform/country/app_version_min shape both the
 * magnitude (`filterScale`) and the curve (folded into the PRNG seed via `filterKey`). Same inputs →
 * same numbers (deterministic within a session); a different filter selection → genuinely different numbers.
 */
export function buildSeries(chart: ChartRecord, filters: DashboardFilters): WidgetSeries[] {
  const { count, stepMs } = granularityFor(filters.date_range.preset);
  const now = Date.now();
  const start = now - count * stepMs;
  const base = baseMagnitude(chart.query_definition.measurement) * filterScale(filters);
  const seed = filterKey(filters);

  return seriesLabels(chart, filters).map((label, seriesIndex) => {
    const rand = mulberry32(hashString(`${chart.id}:${label}:${seed}`));
    const seriesBase = base * (1 - seriesIndex * 0.28);
    const points = Array.from({ length: count }, (_, i) => {
      const wave = Math.sin((i / count) * Math.PI * 2 + seriesIndex) * 0.18;
      const drift = (i / count) * 0.22;
      const noise = (rand() - 0.5) * 0.14;
      const value = Math.max(0, Math.round(seriesBase * (1 + wave + drift + noise)));
      return { ts: new Date(start + i * stepMs).toISOString(), value };
    });
    return { label, points };
  });
}

// ── State machine ────────────────────────────────────────────────────────────

function fakeQueryHash(chart: ChartRecord, filters: DashboardFilters): string {
  const hash = hashString(`${chart.id}:${JSON.stringify(filters)}`).toString(16).padStart(8, "0");
  return `sha256:${hash}${hash}`;
}

/** True when the chart is pinned to a country that conflicts with the dashboard's country filter. */
function hasFilterConflict(chart: ChartRecord, filters: DashboardFilters): boolean {
  if (!filters.country) return false;
  return chart.query_definition.filters.some(
    (f) => f.property === "country" && f.op === "eq" && f.value !== filters.country,
  );
}

function okResult(
  widget: WidgetRecord,
  chart: ChartRecord,
  filters: DashboardFilters,
  runtime: WidgetRuntime,
  isStale: boolean,
): WidgetResult {
  const data: WidgetResultData = {
    visualization_type: chart.visualization_type,
    unit: chart.query_definition.measurement,
    series: buildSeries(chart, filters),
  };
  const computedAtMs = runtime.computed_at;
  return {
    state: isStale ? "stale" : "ok",
    widget_id: widget.id,
    chart_id: chart.id,
    query_hash: fakeQueryHash(chart, filters),
    computed_at: new Date(computedAtMs).toISOString(),
    ttl_expires_at: new Date(computedAtMs + FRESH_WINDOW_MS).toISOString(),
    is_stale: isStale,
    source: isStale ? "cache" : "magnify",
    data,
  };
}

/**
 * Computes the current result for one widget, advancing the per-widget cache runtime to make
 * the stale → revalidating → ok cycle observable across polls (RFC stale-while-revalidate).
 */
export function computeWidgetResult(
  widget: WidgetRecord,
  filters: DashboardFilters,
): WidgetResult {
  const chart = store.charts.get(widget.chart_id);

  // 1. Soft-deleted or missing chart → chart_unavailable (roadmap soft-delete contract).
  if (!chart || chart.deleted_at) {
    return { state: "chart_unavailable", widget_id: widget.id, chart_id: widget.chart_id };
  }

  // 2. Explicit forbidden demo seed.
  if (widget.demo_state === "forbidden") {
    return { state: "forbidden", widget_id: widget.id, chart_id: chart.id };
  }

  const now = Date.now();

  // 3. Rate-limited demo seed — clears once Retry-After elapses.
  if (widget.demo_state === "rate_limited") {
    const runtime = store.runtime.get(widget.id);
    if (runtime?.rate_limited_until && now < runtime.rate_limited_until) {
      return {
        state: "rate_limited",
        widget_id: widget.id,
        chart_id: chart.id,
        retry_after_seconds: Math.ceil((runtime.rate_limited_until - now) / 1000),
      };
    }
  }

  // 4. Filter conflict (chart country vs dashboard country).
  if (hasFilterConflict(chart, filters)) {
    return { state: "filter_conflict", widget_id: widget.id, chart_id: chart.id };
  }

  // 5. ok / stale via the freshness runtime.
  let runtime = store.runtime.get(widget.id);
  if (!runtime) {
    runtime = { computed_at: now, revalidate_at: null, rate_limited_until: null };
    store.runtime.set(widget.id, runtime);
    return okResult(widget, chart, filters, runtime, false);
  }

  if (runtime.revalidate_at !== null) {
    if (now >= runtime.revalidate_at) {
      // Revalidation finished → fresh value.
      runtime.computed_at = now;
      runtime.revalidate_at = null;
      return okResult(widget, chart, filters, runtime, false);
    }
    // Still revalidating → serve stale.
    return okResult(widget, chart, filters, runtime, true);
  }

  if (now - runtime.computed_at > FRESH_WINDOW_MS) {
    // Freshness window elapsed → go stale and kick off async revalidation.
    runtime.revalidate_at = now + REVALIDATE_MS;
    return okResult(widget, chart, filters, runtime, true);
  }

  return okResult(widget, chart, filters, runtime, false);
}

export const RESULT_ENGINE_RETRY_SECONDS = RATE_LIMIT_RETRY_SECONDS;
