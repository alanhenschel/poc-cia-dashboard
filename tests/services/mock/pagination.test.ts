import { describe, expect, it } from "vitest";
import { paginate } from "@/services/mock/pagination";

interface Row {
  id: string;
  updated_at: string;
}

// Ten rows with distinct, ascending timestamps → DESC sort should yield j10..j01.
const rows: Row[] = Array.from({ length: 10 }, (_, i) => ({
  id: `id-${String(i + 1).padStart(2, "0")}`,
  updated_at: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
}));

describe("paginate", () => {
  it("returns all items and a null cursor when the page isn't full", () => {
    const page = paginate(rows, undefined, 20);
    expect(page.items).toHaveLength(10);
    expect(page.next_cursor).toBeNull();
  });

  it("sorts by updated_at DESC", () => {
    const page = paginate(rows, undefined, 20);
    expect(page.items[0].id).toBe("id-10");
    expect(page.items[9].id).toBe("id-01");
  });

  it("respects the limit and yields a cursor when more remain", () => {
    const page = paginate(rows, undefined, 4);
    expect(page.items.map((r) => r.id)).toEqual(["id-10", "id-09", "id-08", "id-07"]);
    expect(page.next_cursor).not.toBeNull();
  });

  it("walks pages via the cursor without gaps or overlaps, ending on a null cursor", () => {
    const seen: string[] = [];
    let cursor: string | null = null;
    for (let guard = 0; guard < 10; guard += 1) {
      const page: ReturnType<typeof paginate<Row>> = paginate(rows, cursor, 4);
      seen.push(...page.items.map((r) => r.id));
      cursor = page.next_cursor;
      if (!cursor) break;
    }
    expect(cursor).toBeNull();
    expect(seen).toHaveLength(10);
    expect(new Set(seen).size).toBe(10); // no duplicates across pages
  });

  it("caps the page size at the max (50) even if a larger limit is requested", () => {
    const many: Row[] = Array.from({ length: 60 }, (_, i) => ({
      id: `x-${i}`,
      updated_at: `2026-02-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
    }));
    const page = paginate(many, undefined, 999);
    expect(page.items).toHaveLength(50);
    expect(page.next_cursor).not.toBeNull();
  });

  it("ignores an unrecognized cursor and returns the first page", () => {
    const page = paginate(rows, "not-a-real-cursor", 3);
    expect(page.items[0].id).toBe("id-10");
  });
});
