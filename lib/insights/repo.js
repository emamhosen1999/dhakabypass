import { query } from '../db.js';
import { asJson } from '../json.js';

/**
 * The snapshot store behind the admin's analytics screens.
 *
 * Reads never touch Google. A refresh — the cron — writes here, and the screen
 * renders whatever the last successful write left, with its age beside it.
 */

/** Every panel the screens know how to draw, and where its figures come from. */
export const PANELS = Object.freeze({
  'daily-totals': 'ga4',
  'top-pages': 'ga4',
  events: 'ga4',
  queries: 'search-console',
  'search-pages': 'search-console',
  sitemaps: 'search-console',
});

const shape = (row) => ({
  panel: row.panel,
  source: row.source,
  payload: asJson(row.payload, null),
  takenAt: row.taken_at ? new Date(row.taken_at) : null,
  failedAt: row.failed_at ? new Date(row.failed_at) : null,
  note: row.note || '',
});

/** Every panel that has ever been written, newest first. */
export async function readSnapshots() {
  const rows = await query(
    'SELECT panel, source, payload, taken_at, failed_at, note FROM insight_snapshots',
  );
  const byPanel = new Map((rows || []).map((row) => [row.panel, shape(row)]));
  // Panels that have never been written appear as empty rather than absent, so
  // a screen renders "not collected yet" instead of leaving a hole.
  return Object.entries(PANELS).map(([panel, source]) =>
    byPanel.get(panel) || { panel, source, payload: null, takenAt: null, failedAt: null, note: '' });
}

/** Store a successful read. Clears any previous failure note. */
export async function writeSnapshot(panel, payload) {
  const source = PANELS[panel];
  if (!source) throw new Error(`unknown panel: ${panel}`);
  await query(
    `INSERT INTO insight_snapshots (panel, source, payload, taken_at, failed_at, note)
     VALUES (?, ?, CAST(? AS JSON), CURRENT_TIMESTAMP, NULL, '')
     ON DUPLICATE KEY UPDATE
       payload = VALUES(payload), source = VALUES(source),
       taken_at = CURRENT_TIMESTAMP, failed_at = NULL, note = ''`,
    [panel, source, JSON.stringify(payload ?? null)],
  );
}

/**
 * Record that a refresh failed, KEEPING the last good payload.
 *
 * A panel that empties itself on a quota error tells the operator that nobody
 * visited the site, which is the one thing it must never say.
 */
export async function noteFailure(panel, message) {
  const source = PANELS[panel];
  if (!source) throw new Error(`unknown panel: ${panel}`);
  const note = String(message || '').slice(0, 255);
  await query(
    `INSERT INTO insight_snapshots (panel, source, payload, failed_at, note)
     VALUES (?, ?, CAST('null' AS JSON), CURRENT_TIMESTAMP, ?)
     ON DUPLICATE KEY UPDATE failed_at = CURRENT_TIMESTAMP, note = VALUES(note)`,
    [panel, source, note],
  );
}
