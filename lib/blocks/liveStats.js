/**
 * Statistics that are facts read from the records rather than typed into a
 * block (audit 5.9). A stat-row item with a `source` shows the current value
 * of that record; one without keeps its typed `value`. Pure: the reader
 * passes in what it loaded, so this is testable without a database.
 */
import { formatKm } from '../corridor/chainage.js';

export const LIVE_SOURCES = Object.freeze([
  { value: '', label: 'Typed value (as entered below)' },
  { value: 'corridor-published-length', label: 'Corridor length, published (Corridor settings)' },
  { value: 'corridor-measured-length', label: 'Corridor length, measured (Corridor sections)' },
  { value: 'corridor-open-length', label: 'Length open to traffic (Corridor sections)' },
  { value: 'toll-class-count', label: 'Number of tolled vehicle classes (Toll rates)' },
  { value: 'interchange-count', label: 'Number of interchanges (Interchanges)' },
]);

const trim = (s) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s);

/** The value for one source, or null when the record is absent. */
export function liveValue(source, facts = {}) {
  const summary = facts.summary || null;
  switch (source) {
    case 'corridor-published-length':
      return Number.isFinite(facts.publishedLengthKm) && facts.publishedLengthKm > 0 ? trim(String(facts.publishedLengthKm)) : null;
    case 'corridor-measured-length': {
      const m = summary?.extent?.length_m;
      return m > 0 ? trim(formatKm(m, 3)) : null;
    }
    case 'corridor-open-length': {
      const m = summary?.openLength;
      return m > 0 ? trim(formatKm(m, 1)) : null;
    }
    case 'toll-class-count':
      return Array.isArray(facts.tollRates) && facts.tollRates.length ? String(facts.tollRates.length) : null;
    case 'interchange-count':
      return Array.isArray(facts.interchanges) && facts.interchanges.length ? String(facts.interchanges.length) : null;
    default:
      return null;
  }
}

/**
 * Items as rendered: a sourced item takes the record's value, and is dropped
 * when the record is absent (a blank statistic is worse than none). A typed
 * item is kept when it has a value.
 */
export function resolveStats(stats, facts) {
  return (Array.isArray(stats) ? stats : [])
    .filter((s) => s && typeof s === 'object')
    .map((s) => (s.source ? { ...s, value: liveValue(s.source, facts) } : s))
    .filter((s) => s.value !== null && s.value !== undefined && String(s.value).trim() !== '');
}

/** Which records a set of items needs, so the block loads only those. */
export function sourcesNeeded(stats) {
  return new Set((Array.isArray(stats) ? stats : []).map((s) => s?.source).filter(Boolean));
}
