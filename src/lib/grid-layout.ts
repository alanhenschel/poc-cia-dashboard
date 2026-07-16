import { verticalCompactor, type Layout } from "react-grid-layout";
import type { WidgetPosition } from "@/types";

/**
 * Pure grid-geometry helpers for the KEYBOARD editing path.
 *
 * Why this exists: react-grid-layout computes drag/resize results itself and hands the already
 * compacted layout to `onDragStop`/`onResizeStop`, so the mouse path is self-consistent. The keyboard
 * path computes positions OUTSIDE RGL and feeds them back via the `layout` prop — and RGL runs its
 * vertical compactor on every `layout` change. Without reconciling here, the persisted (Zustand) value
 * keeps the pre-compaction position while the screen shows the compacted one — a silent divergence
 * (e.g. an ArrowDown into empty vertical space that RGL pulls straight back up). We reconcile using
 * RGL's OWN `verticalCompactor`, so the persisted result is byte-for-byte what RGL renders.
 */

export type PositionMap = Record<string, WidgetPosition>;

const clampValue = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/** Axis-aligned overlap (edge-touching is NOT overlap). */
export function rectsOverlap(a: WidgetPosition, b: WidgetPosition): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Edge-clamped move by whole grid units. */
export function clampedMove(
  pos: WidgetPosition,
  dx: number,
  dy: number,
  cols: number,
): WidgetPosition {
  return {
    ...pos,
    x: clampValue(pos.x + dx, 0, cols - pos.w),
    y: Math.max(0, pos.y + dy),
  };
}

/** Edge-clamped resize by whole grid units, respecting minimum footprint. */
export function clampedResize(
  pos: WidgetPosition,
  dw: number,
  dh: number,
  cols: number,
  minW: number,
  minH: number,
): WidgetPosition {
  return {
    ...pos,
    w: clampValue(pos.w + dw, minW, cols - pos.x),
    h: Math.max(minH, pos.h + dh),
  };
}

/** True if `target` (for `widgetId`) overlaps any OTHER widget's position. */
export function collidesWithOthers(
  widgetId: string,
  target: WidgetPosition,
  positions: PositionMap,
): boolean {
  return Object.entries(positions).some(
    ([id, pos]) => id !== widgetId && rectsOverlap(target, pos),
  );
}

/** Places `target` for `widgetId`, then runs RGL's vertical compaction over the whole layout. */
export function reconcileWithCompaction(
  positions: PositionMap,
  widgetId: string,
  target: WidgetPosition,
  cols: number,
): PositionMap {
  const proposed: Layout = Object.entries(positions).map(([id, pos]) => ({
    i: id,
    ...(id === widgetId ? target : pos),
  }));
  const compacted = verticalCompactor.compact(proposed, cols);
  const result: PositionMap = {};
  for (const item of compacted) {
    result[item.i] = { x: item.x, y: item.y, w: item.w, h: item.h };
  }
  return result;
}

/** Structural equality over every widget position in two maps. */
export function positionsEqual(a: PositionMap, b: PositionMap): boolean {
  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const id of ids) {
    const pa = a[id];
    const pb = b[id];
    if (!pa || !pb || pa.x !== pb.x || pa.y !== pb.y || pa.w !== pb.w || pa.h !== pb.h) {
      return false;
    }
  }
  return true;
}

/**
 * The full keyboard-commit decision, as one pure function:
 * - reject (return null) if the move would overlap another widget (P1 rejection guard),
 * - otherwise reconcile with RGL's vertical compaction,
 * - return null again if the compacted result is identical to the input (a no-op must not dirty
 *   the layout — this is what makes the Y-into-empty-space case correct rather than divergent).
 */
export function computeKeyboardCommit(
  positions: PositionMap,
  widgetId: string,
  target: WidgetPosition,
  cols: number,
): PositionMap | null {
  if (collidesWithOthers(widgetId, target, positions)) return null;
  const next = reconcileWithCompaction(positions, widgetId, target, cols);
  if (positionsEqual(positions, next)) return null;
  return next;
}
