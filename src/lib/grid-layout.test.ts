import { describe, expect, it } from "vitest";
import {
  clampedMove,
  clampedResize,
  collidesWithOthers,
  computeKeyboardCommit,
  positionsEqual,
  rectsOverlap,
  type PositionMap,
} from "./grid-layout";

const COLS = 12;

describe("rectsOverlap", () => {
  it("detects overlapping rects", () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 6, h: 4 }, { x: 3, y: 2, w: 6, h: 4 })).toBe(true);
  });

  it("treats edge-touching as NOT overlapping (adjacent, not stacked)", () => {
    // A ends at x=6, B starts at x=6 → share an edge only.
    expect(rectsOverlap({ x: 0, y: 0, w: 6, h: 4 }, { x: 6, y: 0, w: 6, h: 4 })).toBe(false);
    // Vertically flush: A ends at y=4, B starts at y=4.
    expect(rectsOverlap({ x: 0, y: 0, w: 6, h: 4 }, { x: 0, y: 4, w: 6, h: 4 })).toBe(false);
  });

  it("returns false for fully separate rects", () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 3, h: 3 }, { x: 8, y: 8, w: 3, h: 3 })).toBe(false);
  });
});

describe("clampedMove", () => {
  it("clamps x within [0, cols - w] and y at 0", () => {
    const pos = { x: 0, y: 0, w: 6, h: 4 };
    expect(clampedMove(pos, -3, -3, COLS)).toEqual({ x: 0, y: 0, w: 6, h: 4 });
    expect(clampedMove(pos, +99, +2, COLS)).toEqual({ x: 6, y: 2, w: 6, h: 4 });
  });
});

describe("clampedResize", () => {
  it("respects min footprint and the right edge", () => {
    const pos = { x: 6, y: 0, w: 6, h: 4 };
    // Shrink below min → clamped to min.
    expect(clampedResize(pos, -99, -99, COLS, 3, 3)).toEqual({ x: 6, y: 0, w: 3, h: 3 });
    // Grow past the right edge (x=6, cols=12 → max w=6).
    expect(clampedResize(pos, +99, +1, COLS, 3, 3)).toEqual({ x: 6, y: 0, w: 6, h: 5 });
  });
});

describe("collidesWithOthers", () => {
  const positions: PositionMap = {
    A: { x: 0, y: 0, w: 6, h: 4 },
    B: { x: 6, y: 0, w: 6, h: 4 },
  };

  it("ignores the widget itself", () => {
    expect(collidesWithOthers("A", positions.A, positions)).toBe(false);
  });

  it("detects a collision with another widget", () => {
    expect(collidesWithOthers("A", { x: 4, y: 0, w: 6, h: 4 }, positions)).toBe(true);
  });

  it("does not flag an edge-adjacent position", () => {
    expect(collidesWithOthers("A", { x: 0, y: 4, w: 6, h: 4 }, positions)).toBe(false);
  });
});

describe("computeKeyboardCommit", () => {
  it("accepts a move into free space and returns the new positions", () => {
    const positions: PositionMap = { A: { x: 0, y: 0, w: 6, h: 4 } };
    const next = computeKeyboardCommit(positions, "A", { x: 3, y: 0, w: 6, h: 4 }, COLS);
    expect(next).not.toBeNull();
    expect(next!.A).toEqual({ x: 3, y: 0, w: 6, h: 4 });
  });

  it("rejects a move that would overlap another widget (returns null, no change)", () => {
    const positions: PositionMap = {
      A: { x: 0, y: 0, w: 6, h: 4 },
      B: { x: 6, y: 0, w: 6, h: 4 },
    };
    // Move A right onto B.
    expect(computeKeyboardCommit(positions, "A", { x: 6, y: 0, w: 6, h: 4 }, COLS)).toBeNull();
  });

  it("REGRESSION: a downward move into empty space is a no-op, never a divergent persist", () => {
    // Repro of the Session-3 bug: top-row widget, empty space below. ArrowDown → target y:1.
    // RGL's vertical compactor pulls it straight back to y:0, so the persisted value must NOT change.
    const positions: PositionMap = {
      A: { x: 0, y: 0, w: 6, h: 4 },
      B: { x: 6, y: 0, w: 6, h: 4 },
    };
    const target = clampedMove(positions.A, 0, +1, COLS); // { x:0, y:1, ... }
    expect(target.y).toBe(1); // the naive (pre-compaction) value that used to get persisted
    // After reconciliation with RGL's own compactor, it collapses back → no change → null.
    expect(computeKeyboardCommit(positions, "A", target, COLS)).toBeNull();
  });

  it("rejects a downward move that would swap into a stacked widget", () => {
    const positions: PositionMap = {
      A: { x: 0, y: 0, w: 6, h: 4 },
      C: { x: 0, y: 4, w: 6, h: 4 },
    };
    // Move A down into C's rows → overlap → rejected (rejection over displacement, by design).
    expect(computeKeyboardCommit(positions, "A", { x: 0, y: 4, w: 6, h: 4 }, COLS)).toBeNull();
  });
});

describe("positionsEqual", () => {
  it("is true for identical maps and false when any field differs", () => {
    const a: PositionMap = { A: { x: 0, y: 0, w: 6, h: 4 } };
    expect(positionsEqual(a, { A: { x: 0, y: 0, w: 6, h: 4 } })).toBe(true);
    expect(positionsEqual(a, { A: { x: 0, y: 1, w: 6, h: 4 } })).toBe(false);
    expect(positionsEqual(a, {})).toBe(false);
  });
});
