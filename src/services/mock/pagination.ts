import type { Paginated } from "@/types";
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from "./config";
import { decodeCursor, encodeCursor } from "./ids";

interface Sortable {
  id: string;
  updated_at: string;
}

/**
 * Cursor pagination over an in-memory list, matching the Epic 3 contract:
 * sort fixed on `updated_at DESC`, cursor = base64({ sort_key, id }), default 20 / max 50.
 */
export function paginate<T extends Sortable>(
  all: T[],
  cursor: string | null | undefined,
  limit: number | undefined,
): Paginated<T> {
  const pageSize = Math.min(limit ?? PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX);

  const sorted = [...all].sort((a, b) => {
    if (a.updated_at !== b.updated_at) {
      return a.updated_at < b.updated_at ? 1 : -1; // updated_at DESC
    }
    return a.id < b.id ? 1 : -1;
  });

  let startIndex = 0;
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      const idx = sorted.findIndex(
        (item) => item.updated_at === decoded.sort_key && item.id === decoded.id,
      );
      if (idx >= 0) startIndex = idx + 1;
    }
  }

  const page = sorted.slice(startIndex, startIndex + pageSize);
  const last = page[page.length - 1];
  const hasMore = startIndex + pageSize < sorted.length;

  return {
    items: page,
    next_cursor:
      hasMore && last ? encodeCursor({ sort_key: last.updated_at, id: last.id }) : null,
  };
}
