/**
 * Pure corridor maths. Kept free of the database and the DOM so the strip's
 * geometry and the published progress figure are both testable directly.
 */

const list = (v) => (Array.isArray(v) ? v : []);

export function corridorExtent(segments) {
  const rows = list(segments);
  if (rows.length === 0) return { from_m: 0, to_m: 0, length_m: 0 };
  const from_m = Math.min(...rows.map((s) => s.from_m));
  const to_m = Math.max(...rows.map((s) => s.to_m));
  return { from_m, to_m, length_m: to_m - from_m };
}

export function openLength(segments) {
  return list(segments)
    .filter((s) => s.status === 'open')
    .reduce((total, s) => total + (s.to_m - s.from_m), 0);
}

/**
 * The published "works complete" figure. Derived from the segments so the
 * home page and the status page cannot drift apart — never hand-entered.
 */
export function percentOpen(segments) {
  const { length_m } = corridorExtent(segments);
  if (length_m <= 0) return 0;
  return Math.round((openLength(segments) / length_m) * 1000) / 10;
}

/** Where a chainage sits along the strip, 0–100. Clamped so a bad row cannot
 *  push a marker outside the rail. */
export function positionPercent(metres, extent) {
  if (!extent || extent.length_m <= 0) return 0;
  const raw = ((metres - extent.from_m) / extent.length_m) * 100;
  return Math.min(100, Math.max(0, Math.round(raw * 100) / 100));
}

export function sortByChainage(items) {
  return [...list(items)].sort((a, b) => a.chainage_m - b.chainage_m);
}

/** Touching endpoints are adjacent, not overlapping — segments meet at a point. */
export function overlaps(a, b) {
  return a.from_m < b.to_m && b.from_m < a.to_m;
}
