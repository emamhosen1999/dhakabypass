import { query, dbEnabled } from '../db.js';
import { conditionKey, CONDITION_RANK } from './conditions.js';

/**
 * Typical speed by hour, from the measurements the refresh has kept.
 *
 * Bangladesh's weekend is Friday and Saturday, so the day types are
 * "working day" and "Friday–Saturday" rather than the Monday–Friday split a
 * generic library would assume. Hours are Dhaka wall-clock hours, whatever
 * zone the server runs in.
 */
export const CORRIDOR_TIME_ZONE = 'Asia/Dhaka';
export const DAY_TYPES = ['weekday', 'weekend'];
export const HOURS = Array.from({ length: 24 }, (_, h) => h);

const MAX_DAYS = 400;

export async function listTrafficHistory({ days = 90 } = {}) {
  if (!dbEnabled()) return [];
  const take = Math.min(Math.max(Math.floor(Number(days)) || 90, 1), MAX_DAYS);
  try {
    return (await query(
      `SELECT section_id, measured_at, condition_key, avg_speed_kmh, source
         FROM traffic_history
        WHERE measured_at >= DATE_SUB(NOW(), INTERVAL ${take} DAY) AND avg_speed_kmh IS NOT NULL
        ORDER BY measured_at`,
    )) || [];
  } catch {
    return [];
  }
}

const partsFormat = new Map();
function dhakaParts(date, timeZone) {
  if (!partsFormat.has(timeZone)) {
    partsFormat.set(timeZone, new Intl.DateTimeFormat('en-GB', {
      timeZone, hourCycle: 'h23', weekday: 'short', hour: 'numeric',
    }));
  }
  const parts = partsFormat.get(timeZone).formatToParts(date);
  const out = {};
  for (const p of parts) out[p.type] = p.value;
  return { weekday: out.weekday, hour: Number(out.hour) % 24 };
}

export function dayTypeOf(weekday) {
  return weekday === 'Fri' || weekday === 'Sat' ? 'weekend' : 'weekday';
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** The condition most measurements agreed on; the worse one wins a tie. */
function modalCondition(keys) {
  const counts = new Map();
  for (const k of keys) counts.set(k, (counts.get(k) || 0) + 1);
  let best = 'unknown';
  let bestCount = -1;
  for (const [k, n] of counts) {
    if (n > bestCount || (n === bestCount && CONDITION_RANK[k] < CONDITION_RANK[best])) {
      best = k;
      bestCount = n;
    }
  }
  return best;
}

/**
 * Rows -> per section, per day type, 24 cells. A cell with fewer than
 * `minSamples` measurements is null: three readings at 03:00 on one night
 * are not "typical", and a number in that cell would claim they were.
 */
export function bucketHistory(rows, { minSamples = 3, timeZone = CORRIDOR_TIME_ZONE } = {}) {
  const min = Math.max(1, Math.floor(Number(minSamples)) || 3);
  const raw = new Map();
  let samples = 0;
  let from = null;
  let to = null;
  for (const r of Array.isArray(rows) ? rows : []) {
    const speed = Number(r?.avg_speed_kmh);
    const at = r?.measured_at ? new Date(r.measured_at) : null;
    if (!Number.isFinite(speed) || speed <= 0 || !at || Number.isNaN(at.getTime())) continue;
    const id = Number(r.section_id);
    if (!Number.isInteger(id)) continue;
    const { weekday, hour } = dhakaParts(at, timeZone);
    const dayType = dayTypeOf(weekday);
    if (!raw.has(id)) raw.set(id, { weekday: HOURS.map(() => []), weekend: HOURS.map(() => []) });
    raw.get(id)[dayType][hour].push({ speed, condition: conditionKey(r.condition_key) });
    samples += 1;
    if (!from || at < from) from = at;
    if (!to || at > to) to = at;
  }

  const sections = new Map();
  for (const [id, byType] of raw) {
    const out = {};
    for (const type of DAY_TYPES) {
      out[type] = byType[type].map((cell) => (cell.length < min ? null : {
        n: cell.length,
        speed: median(cell.map((c) => c.speed)),
        condition: modalCondition(cell.map((c) => c.condition)),
      }));
    }
    sections.set(id, out);
  }
  return { sections, samples, from, to };
}

/** True when at least one cell anywhere has enough measurements to show. */
export function hasEnough(bucketed) {
  for (const byType of bucketed.sections.values()) {
    for (const type of DAY_TYPES) if (byType[type].some((c) => c !== null)) return true;
  }
  return false;
}
