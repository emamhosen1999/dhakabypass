import { listItems, text } from './items.js';

/**
 * The concession scorecard's arithmetic, kept out of the component so the
 * one figure it computes, the term's progress, is testable on its own.
 */
const DAY_MS = 86_400_000;

/** "2018-12-06" -> a UTC midnight Date, or null. Nothing looser is accepted:
 *  a date typed as 6/12/2018 is ambiguous and must be corrected, not guessed. */
export function parseIsoDate(value) {
  const s = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
}

/**
 * Days elapsed and remaining between two dates, at `now`. Null unless both
 * dates parse and the end is after the start; clamped so a term not yet
 * begun reads 0 % and a finished one 100 %.
 */
export function termProgress(start, end, now = new Date()) {
  const a = parseIsoDate(start);
  const b = parseIsoDate(end);
  if (!a || !b || b <= a) return null;
  const total = Math.round((b - a) / DAY_MS);
  const elapsedRaw = Math.floor((now - a) / DAY_MS);
  const elapsed = Math.min(Math.max(elapsedRaw, 0), total);
  return {
    start: a, end: b, totalDays: total, elapsedDays: elapsed, remainingDays: total - elapsed,
    percent: Math.round((elapsed / total) * 1000) / 10,
    state: elapsedRaw < 0 ? 'before' : elapsedRaw >= total ? 'ended' : 'running',
  };
}

/** Rows with at least a name; everything else is a text the editor typed or left blank. */
export function scorecardRows(items) {
  return listItems(items)
    .map((r) => ({
      indicator: text(r.indicator),
      target: text(r.target),
      actual: text(r.actual),
      unit: text(r.unit),
      asOf: text(r.asOf),
      source: text(r.source),
      sourceHref: text(r.sourceHref),
    }))
    .filter((r) => r.indicator);
}
