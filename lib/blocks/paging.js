/**
 * Page arithmetic for the listing blocks (INT.6). Pure.
 */

/** The page a `?page=` value names, clamped to what exists: 1 when blank,
 *  garbage, zero or negative; the last page when past the end. */
export function pageOf(raw, total, perPage) {
  const per = Math.max(1, Number(perPage) || 1);
  const pages = Math.max(1, Math.ceil((Number(total) || 0) / per));
  const n = Math.floor(Number(Array.isArray(raw) ? raw[0] : raw));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, pages);
}

/** The page numbers to render: all of them (a gallery has tens of pages at
 *  most), or none when there is only one. */
export function pageLinks(page, total, perPage) {
  const per = Math.max(1, Number(perPage) || 1);
  const pages = Math.max(1, Math.ceil((Number(total) || 0) / per));
  if (pages <= 1) return [];
  return Array.from({ length: pages }, (_, i) => i + 1);
}
