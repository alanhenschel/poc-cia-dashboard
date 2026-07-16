import type { DashboardFilters } from "@/types";
import { MOCK_PRINCIPAL, RATE_LIMIT_RETRY_SECONDS } from "./config";
import {
  hydrateStore,
  persistStore,
  store,
  type ChartRecord,
  type DashboardRecord,
  type WidgetRecord,
} from "./store";

/**
 * Seeds a handful of realistic dashboards/charts/widgets so the UI is never empty on first load,
 * and so EVERY widget-result state (Epic 7) is renderable on the "Onboarding funnel — Q2"
 * dashboard from context.md. Runs exactly once per module lifetime.
 */

const ISABELA = "isabela.souza@nubank.com.br";
const LUIS = "luis.jaeger@nubank.com.br";

const T = (iso: string) => iso;

function chart(partial: Omit<ChartRecord, "deleted_at"> & { deleted_at?: string | null }): ChartRecord {
  return { deleted_at: null, ...partial };
}

const CHARTS: ChartRecord[] = [
  chart({
    id: "018f5d92-1a4f-7c22-b8e1-2a9f0c4d51bb",
    name: "Sign-up completion by platform",
    owner_id: ISABELA,
    visualization_type: "line",
    query_definition: {
      metric: "screen_viewed",
      measurement: "unique_customers",
      filters: [{ property: "screen_name", op: "eq", value: "signup_completed" }],
      group_by: ["platform"],
    },
    created_at: T("2026-05-20T11:00:00Z"),
    updated_at: T("2026-05-20T11:00:00Z"),
  }),
  chart({
    id: "018f5d92-2b60-7d10-a1c2-77e0a1b2c3d4",
    name: "App opens by platform",
    owner_id: MOCK_PRINCIPAL,
    visualization_type: "line",
    query_definition: {
      metric: "app_opened",
      measurement: "unique_customers",
      filters: [],
      group_by: ["platform"],
    },
    created_at: T("2026-05-21T09:30:00Z"),
    updated_at: T("2026-05-27T15:10:00Z"),
  }),
  chart({
    id: "018f5d92-3c71-7e20-b2d3-88f1b2c3d4e5",
    name: "Transactions completed",
    owner_id: MOCK_PRINCIPAL,
    visualization_type: "line",
    query_definition: {
      metric: "transaction_completed",
      measurement: "event_count",
      filters: [],
      group_by: [],
    },
    created_at: T("2026-05-18T08:00:00Z"),
    updated_at: T("2026-05-26T12:00:00Z"),
  }),
  chart({
    id: "018f5d92-4d82-7f30-c3e4-99a2c3d4e5f6",
    name: "Home CTA taps",
    owner_id: LUIS,
    visualization_type: "line",
    query_definition: {
      metric: "button_tapped",
      measurement: "event_count",
      filters: [{ property: "button_id", op: "eq", value: "home_primary_cta" }],
      group_by: ["platform"],
    },
    created_at: T("2026-05-19T14:20:00Z"),
    updated_at: T("2026-05-24T10:05:00Z"),
  }),
  chart({
    id: "018f5d92-5e93-7040-d4f5-aab3d4e5f607",
    name: "Pix adoption — Mexico",
    owner_id: ISABELA,
    visualization_type: "line",
    query_definition: {
      metric: "transaction_completed",
      measurement: "unique_customers",
      // Chart is scoped to MX; a dashboard filtered to BR intersects to empty → filter_conflict.
      filters: [{ property: "country", op: "eq", value: "mx" }],
      group_by: ["platform"],
    },
    created_at: T("2026-05-22T16:40:00Z"),
    updated_at: T("2026-05-22T16:40:00Z"),
  }),
  chart({
    id: "018f5d92-6fa4-7150-e506-bbc4e5f60718",
    name: "Deprecated onboarding funnel",
    owner_id: ISABELA,
    visualization_type: "line",
    query_definition: {
      metric: "screen_viewed",
      measurement: "unique_customers",
      filters: [],
      group_by: [],
    },
    created_at: T("2026-04-01T10:00:00Z"),
    updated_at: T("2026-05-10T10:00:00Z"),
    // Soft-deleted → any widget referencing it renders chart_unavailable.
    deleted_at: T("2026-05-30T18:00:00Z"),
  }),
  chart({
    id: "018f5d92-70b5-7260-f617-ccd5f6071829",
    name: "Weekly active sessions",
    owner_id: MOCK_PRINCIPAL,
    visualization_type: "line",
    query_definition: {
      metric: "app_opened",
      measurement: "sessions",
      filters: [],
      group_by: ["country"],
    },
    created_at: T("2026-05-15T07:00:00Z"),
    updated_at: T("2026-05-28T07:00:00Z"),
  }),
  chart({
    id: "018f5d92-81c6-7370-0728-dde607182930",
    name: "Screen views by country",
    owner_id: MOCK_PRINCIPAL,
    visualization_type: "line",
    query_definition: {
      metric: "screen_viewed",
      measurement: "event_count",
      filters: [],
      group_by: ["country"],
    },
    created_at: T("2026-05-16T13:00:00Z"),
    updated_at: T("2026-05-25T13:00:00Z"),
  }),
];

const ONBOARDING_FILTERS: DashboardFilters = {
  date_range: { preset: "last_7d" },
  platform: ["ios", "android"],
  country: "br",
  app_version_min: "5.42.0",
};

const DASHBOARDS: DashboardRecord[] = [
  {
    id: "018f5e4a-2c10-7a3b-9d40-3f1c8b9a2e77",
    name: "Onboarding funnel — Q2",
    owner_id: ISABELA,
    tags: ["onboarding"],
    filters: ONBOARDING_FILTERS,
    created_at: T("2026-05-22T14:12:08Z"),
    updated_at: T("2026-05-28T09:03:11Z"),
  },
  {
    id: "018f5e4a-3d21-7b4c-ae51-401d9caf3f88",
    name: "Payments health",
    owner_id: MOCK_PRINCIPAL,
    tags: ["payments", "reliability"],
    filters: {
      date_range: { preset: "last_24h" },
      platform: [],
      country: null,
      app_version_min: null,
    },
    created_at: T("2026-05-23T10:00:00Z"),
    updated_at: T("2026-06-02T11:20:00Z"),
  },
  {
    id: "018f5e4a-4e32-7c5d-bf62-512eadb04099",
    name: "Growth overview — LatAm",
    owner_id: MOCK_PRINCIPAL,
    tags: ["growth", "latam"],
    filters: {
      date_range: { preset: "last_30d" },
      platform: ["android"],
      country: null,
      app_version_min: null,
    },
    created_at: T("2026-05-24T09:00:00Z"),
    updated_at: T("2026-06-01T08:45:00Z"),
  },
  {
    id: "018f5e4a-5f43-7d6e-c073-623fbec1519a",
    name: "Retention snapshot",
    owner_id: LUIS,
    tags: ["retention"],
    filters: {
      date_range: { preset: "last_90d" },
      platform: [],
      country: "br",
      app_version_min: null,
    },
    created_at: T("2026-05-25T15:30:00Z"),
    updated_at: T("2026-05-29T16:10:00Z"),
  },
];

/** [dashboardId, chartId, position, createdAt, demoState?] tuples for seeded widgets. */
type WidgetSeed = Omit<WidgetRecord, "type">;

const D_ONBOARDING = DASHBOARDS[0].id;
const D_PAYMENTS = DASHBOARDS[1].id;
const D_GROWTH = DASHBOARDS[2].id;
const D_RETENTION = DASHBOARDS[3].id;

const WIDGETS: WidgetSeed[] = [
  // Onboarding — six widgets, engineered to surface every result state.
  { id: "w-onb-1", dashboard_id: D_ONBOARDING, chart_id: CHARTS[0].id, position: { x: 0, y: 0, w: 6, h: 4 }, created_at: T("2026-05-22T14:13:00Z") },
  { id: "w-onb-2", dashboard_id: D_ONBOARDING, chart_id: CHARTS[1].id, position: { x: 6, y: 0, w: 6, h: 4 }, created_at: T("2026-05-22T14:14:00Z") },
  { id: "w-onb-3", dashboard_id: D_ONBOARDING, chart_id: CHARTS[4].id, position: { x: 0, y: 4, w: 6, h: 4 }, created_at: T("2026-05-22T14:15:00Z") }, // filter_conflict (MX chart vs BR dashboard)
  { id: "w-onb-4", dashboard_id: D_ONBOARDING, chart_id: CHARTS[6].id, position: { x: 6, y: 4, w: 6, h: 4 }, created_at: T("2026-05-22T14:16:00Z"), demo_state: "forbidden" },
  { id: "w-onb-5", dashboard_id: D_ONBOARDING, chart_id: CHARTS[5].id, position: { x: 0, y: 8, w: 6, h: 4 }, created_at: T("2026-05-22T14:17:00Z") }, // chart_unavailable (soft-deleted)
  { id: "w-onb-6", dashboard_id: D_ONBOARDING, chart_id: CHARTS[2].id, position: { x: 6, y: 8, w: 6, h: 4 }, created_at: T("2026-05-22T14:18:00Z"), demo_state: "rate_limited" },

  // Payments health.
  { id: "w-pay-1", dashboard_id: D_PAYMENTS, chart_id: CHARTS[2].id, position: { x: 0, y: 0, w: 8, h: 4 }, created_at: T("2026-05-23T10:05:00Z") },
  { id: "w-pay-2", dashboard_id: D_PAYMENTS, chart_id: CHARTS[6].id, position: { x: 8, y: 0, w: 4, h: 4 }, created_at: T("2026-05-23T10:06:00Z") },
  { id: "w-pay-3", dashboard_id: D_PAYMENTS, chart_id: CHARTS[7].id, position: { x: 0, y: 4, w: 12, h: 4 }, created_at: T("2026-05-23T10:07:00Z") },

  // Growth overview.
  { id: "w-gro-1", dashboard_id: D_GROWTH, chart_id: CHARTS[1].id, position: { x: 0, y: 0, w: 6, h: 4 }, created_at: T("2026-05-24T09:05:00Z") },
  { id: "w-gro-2", dashboard_id: D_GROWTH, chart_id: CHARTS[3].id, position: { x: 6, y: 0, w: 6, h: 4 }, created_at: T("2026-05-24T09:06:00Z") },
  { id: "w-gro-3", dashboard_id: D_GROWTH, chart_id: CHARTS[7].id, position: { x: 0, y: 4, w: 12, h: 5 }, created_at: T("2026-05-24T09:07:00Z") },

  // Retention snapshot (owned by Luis — read-only for the mock principal).
  { id: "w-ret-1", dashboard_id: D_RETENTION, chart_id: CHARTS[0].id, position: { x: 0, y: 0, w: 6, h: 4 }, created_at: T("2026-05-25T15:35:00Z") },
  { id: "w-ret-2", dashboard_id: D_RETENTION, chart_id: CHARTS[6].id, position: { x: 6, y: 0, w: 6, h: 4 }, created_at: T("2026-05-25T15:36:00Z") },
];

let seeded = false;

/**
 * Arms the rate-limited demo widget's runtime so it opens in the rate_limited state then recovers.
 * Runtime is ephemeral (never persisted), so this runs on every fresh module load — whether the
 * store was seeded or hydrated from localStorage — as long as that widget still exists.
 */
function armRateLimitDemo(): void {
  const rateLimited = [...store.widgets.values()].find((w) => w.demo_state === "rate_limited");
  if (rateLimited) {
    store.runtime.set(rateLimited.id, {
      computed_at: Date.now(),
      revalidate_at: null,
      rate_limited_until: Date.now() + RATE_LIMIT_RETRY_SECONDS * 1000,
    });
  }
}

export function ensureSeeded(): void {
  if (seeded) return;
  seeded = true;

  // Prefer a persisted store (durable across reloads); fall back to the seed data on first run.
  if (hydrateStore()) {
    armRateLimitDemo();
    return;
  }

  for (const c of CHARTS) store.charts.set(c.id, c);
  for (const d of DASHBOARDS) store.dashboards.set(d.id, d);
  for (const w of WIDGETS) store.widgets.set(w.id, { ...w, type: "chart" });

  armRateLimitDemo();
  persistStore();
}
