/**
 * ID + cursor helpers for the mock backend.
 * NOTE: context.md specifies UUID v7 (time-sortable). `crypto.randomUUID()` emits v4; the mock
 * relies on an explicit `updated_at` sort instead of id-ordering, so v4 is sufficient here.
 */

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Cursor = base64(JSON({ sort_key, id })). Mirrors the Epic 3 pagination contract. */
export interface CursorPayload {
  sort_key: string;
  id: string;
}

export function encodeCursor(payload: CursorPayload): string {
  return btoa(JSON.stringify(payload));
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const parsed = JSON.parse(atob(cursor)) as CursorPayload;
    if (typeof parsed.sort_key === "string" && typeof parsed.id === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
