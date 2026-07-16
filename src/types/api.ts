/**
 * Transport-level contracts shared by every cia-backend resource.
 * Mirrors the "Standard error" envelope and list pagination shapes in context.md.
 */

/** Error codes the backend can return in the standard envelope (RFC: 403/404/422/429). */
export type ApiErrorCode =
  | "forbidden"
  | "not_found"
  | "unprocessable"
  | "rate_limited"
  | "internal";

/** RFC "Standard error" body. `details` is intentionally loose (internal tool, verbose detail). */
export interface ApiErrorEnvelope {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Cursor-paginated list response. `next_cursor` is null on the last page.
 * RFC: `{ items: [...], next_cursor: null }`.
 */
export interface Paginated<TItem> {
  items: TItem[];
  next_cursor: string | null;
}

/** Query params accepted by list endpoints. RFC: default page size 20, max 50, sort updated_at DESC. */
export interface ListParams {
  cursor?: string | null;
  limit?: number;
  /** Client-side convenience filter (search by name/owner/tag). Roadmap flags search as M2/M3. */
  search?: string;
}
