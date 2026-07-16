import type {
  Chart,
  ChartListItem,
  ListParams,
  Paginated,
  QueryDefinition,
  VisualizationType,
} from "@/types";
import { ApiError } from "@/lib/api-error";
import { MOCK_PRINCIPAL } from "./mock/config";
import { newId, nowIso } from "./mock/ids";
import { withRead, withWrite } from "./mock/network";
import { paginate } from "./mock/pagination";
import { ensureSeeded } from "./mock/seed";
import {
  canMutate,
  store,
  toChartListItem,
  toChartWire,
  type ChartRecord,
} from "./mock/store";

/**
 * Public Charts API facade — the sole reach into the mock backend for the charts domain.
 * Swap each body for a `fetch` to context.md's /api/charts routes to go live.
 */

export interface CreateChartInput {
  name: string;
  visualization_type: VisualizationType;
  query_definition: QueryDefinition;
}

export interface UpdateChartInput {
  name?: string;
  visualization_type?: VisualizationType;
  query_definition?: QueryDefinition;
}

function requireChart(id: string): ChartRecord {
  const record = store.charts.get(id);
  // Soft-deleted charts are treated as gone for the standalone chart surface.
  if (!record || record.deleted_at) throw ApiError.notFound("chart", id);
  return record;
}

function requireOwnedChart(id: string): ChartRecord {
  const record = requireChart(id);
  // Charts are owner-only for mutation, including admins (RFC): no super-owner bypass here.
  if (!canMutate(record.owner_id)) throw ApiError.forbidden("chart", id);
  return record;
}

function matchesSearch(item: ChartListItem, search?: string): boolean {
  if (!search) return true;
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return (
    item.name.toLowerCase().includes(needle) ||
    item.owner_id.toLowerCase().includes(needle)
  );
}

// ── GET /api/charts ──────────────────────────────────────────────────────────
export function listCharts(params: ListParams = {}): Promise<Paginated<ChartListItem>> {
  return withRead(() => {
    ensureSeeded();
    const items = [...store.charts.values()]
      .filter((c) => c.deleted_at === null) // exclude soft-deleted from listings
      .map(toChartListItem)
      .filter((item) => matchesSearch(item, params.search));
    return paginate(items, params.cursor, params.limit);
  });
}

// ── GET /api/charts/:id ──────────────────────────────────────────────────────
export function getChart(id: string): Promise<Chart> {
  return withRead(() => {
    ensureSeeded();
    return toChartWire(requireChart(id));
  });
}

/**
 * Resolve charts by id — the correct way to look up the charts referenced by a dashboard's widgets,
 * independent of pagination or sort order (the paginated list would miss any chart past page 1).
 * Returns only live (non-deleted) charts; soft-deleted / missing ids are simply absent from the
 * result, which the caller renders as the "chart unavailable" widget state.
 * A real cia-backend would expose this as `GET /api/charts?ids=a,b,c` or a batch endpoint.
 */
export function getChartsByIds(ids: string[]): Promise<Chart[]> {
  return withRead(() => {
    ensureSeeded();
    const unique = [...new Set(ids)];
    return unique
      .map((id) => store.charts.get(id))
      .filter((record): record is ChartRecord => Boolean(record) && record!.deleted_at === null)
      .map(toChartWire);
  });
}

// ── POST /api/charts ─────────────────────────────────────────────────────────
export function createChart(input: CreateChartInput): Promise<Chart> {
  return withWrite(() => {
    ensureSeeded();
    const timestamp = nowIso();
    const record: ChartRecord = {
      id: newId(),
      name: input.name.trim(),
      owner_id: MOCK_PRINCIPAL,
      visualization_type: input.visualization_type,
      query_definition: input.query_definition,
      created_at: timestamp,
      updated_at: timestamp,
      deleted_at: null,
    };
    store.charts.set(record.id, record);
    return toChartWire(record);
  });
}

// ── PATCH /api/charts/:id ────────────────────────────────────────────────────
export function updateChart(id: string, patch: UpdateChartInput): Promise<Chart> {
  return withWrite(() => {
    ensureSeeded();
    const record = requireOwnedChart(id);
    if (patch.name !== undefined) record.name = patch.name.trim();
    if (patch.visualization_type !== undefined) {
      record.visualization_type = patch.visualization_type;
    }
    if (patch.query_definition !== undefined) {
      record.query_definition = patch.query_definition;
    }
    record.updated_at = nowIso();
    return toChartWire(record);
  });
}

// ── DELETE /api/charts/:id (soft delete) ─────────────────────────────────────
export function deleteChart(id: string): Promise<void> {
  return withWrite(() => {
    ensureSeeded();
    const record = requireOwnedChart(id);
    record.deleted_at = nowIso(); // soft delete: hidden from lists; widgets render chart_unavailable
  });
}

// ── POST /api/charts/:id/copy (fork-on-edit) ─────────────────────────────────
export function copyChart(id: string): Promise<Chart> {
  return withWrite(() => {
    ensureSeeded();
    // Any user may copy any (non-deleted) chart — a read operation on the original.
    const source = requireChart(id);
    const timestamp = nowIso();
    const clone: ChartRecord = {
      id: newId(),
      name: `${source.name} (copy)`,
      owner_id: MOCK_PRINCIPAL, // caller becomes owner of the clone
      visualization_type: source.visualization_type,
      query_definition: structuredClone(source.query_definition),
      created_at: timestamp,
      updated_at: timestamp,
      deleted_at: null,
    };
    store.charts.set(clone.id, clone);
    return toChartWire(clone);
  });
}
