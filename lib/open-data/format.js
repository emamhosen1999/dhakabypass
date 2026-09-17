import { conditionKey } from '../corridor/conditions.js';
import { localeMessage } from '../corridor/advisories.js';
import { localeText } from '../corridor/interchanges.js';
import { sectionCode } from '../blocks/trafficStatus.js';
import { formatChainage } from '../corridor/chainage.js';
import { asJson, isPlainObject } from '../json.js';

/**
 * The open-data feeds, shaped. Pure functions over the same rows the pages
 * read, so a figure in the JSON is the figure on the page, with the same
 * sample and provisional flags carried along rather than stripped.
 */

/** The public endpoints, listed once for the block and the tests. */
export const OPEN_DATA_ENDPOINTS = Object.freeze([
  { id: 'status', path: '/api/public/corridor-status', format: 'JSON', nameKey: 'odStatusName', descKey: 'odStatusDesc' },
  { id: 'monthly', path: '/api/public/traffic-monthly.csv', format: 'CSV', nameKey: 'odMonthlyName', descKey: 'odMonthlyDesc' },
  { id: 'history', path: '/api/public/traffic-history.csv', format: 'CSV', nameKey: 'odHistoryName', descKey: 'odHistoryDesc' },
  { id: 'advisories', path: '/api/public/advisories.ics', format: 'iCalendar', nameKey: 'odIcsName', descKey: 'odIcsDesc' },
]);

const iso = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

// `corridor_waypoints.names` arrives as JSON text on MariaDB and as an object
// on MySQL; `interchanges.names` is already shaped by its reader.
const names = (row) => {
  const out = {};
  const map = asJson(row?.names, {});
  for (const locale of ['en', 'bn', 'zh']) {
    const v = localeText(isPlainObject(map) ? map : {}, locale);
    if (v) out[locale] = v;
  }
  return out;
};

export function corridorStatusPayload({
  sections = [], waypoints = [], source = 'sample', advisories = [], interchanges = [], generatedAt = new Date(),
} = {}) {
  const byCode = new Map((waypoints || []).map((w) => [w.code, w]));
  const chainage = (code) => Number(byCode.get(code)?.chainage_m);
  return {
    generated_at: iso(generatedAt),
    // 'sample' means the conditions describe nothing real; 'google', 'tomtom'
    // and 'operator' are measurements or an operator's own entries.
    traffic_source: source,
    sections: (sections || []).map((s) => ({
      code: sectionCode(s),
      from: { code: s.from_code, chainage_m: chainage(s.from_code), names: names(byCode.get(s.from_code)) },
      to: { code: s.to_code, chainage_m: chainage(s.to_code), names: names(byCode.get(s.to_code)) },
      condition: conditionKey(s.condition_key),
      avg_speed_kmh: Number(s.avg_speed_kmh) > 0 ? Number(s.avg_speed_kmh) : null,
      measured_at: iso(s.measured_at),
    })),
    advisories: (advisories || []).map((a) => ({
      id: a.id,
      severity: a.severity,
      starts_at: iso(a.starts_at),
      ends_at: iso(a.ends_at),
      messages: { en: localeMessage(a, 'en'), bn: localeMessage(a, 'bn'), zh: localeMessage(a, 'zh') },
    })),
    facilities: (interchanges || []).map((i) => ({
      id: i.id,
      kind: i.kind,
      status: i.status,
      chainage_m: Number(i.chainage_m),
      chainage: formatChainage(Number(i.chainage_m)),
      names: names(i),
      lat: i.lat === null || i.lat === undefined ? null : Number(i.lat),
      lng: i.lng === null || i.lng === undefined ? null : Number(i.lng),
    })),
  };
}

/** RFC 4180: quote when needed, CRLF line ends, a header row first. */
export function toCsv(columns, rows) {
  const cell = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map(cell).join(',')];
  for (const r of rows) lines.push(columns.map((c) => cell(r[c])).join(','));
  return `${lines.join('\r\n')}\r\n`;
}

export function monthlyCsv(rows, source) {
  return toCsv(['month', 'plaza', 'vehicles', 'source'], (rows || []).map((r) => ({
    month: r.month, plaza: r.plaza, vehicles: r.vehicles, source,
  })));
}

export function historyCsv(rows, sections) {
  const byId = new Map((sections || []).map((s) => [Number(s.id), s]));
  return toCsv(['measured_at', 'section', 'from', 'to', 'condition', 'avg_speed_kmh', 'source'], (rows || []).map((r) => {
    const s = byId.get(Number(r.section_id));
    return {
      measured_at: iso(r.measured_at),
      section: s ? sectionCode(s) : String(r.section_id),
      from: s?.from_code || '',
      to: s?.to_code || '',
      condition: conditionKey(r.condition_key),
      avg_speed_kmh: r.avg_speed_kmh,
      source: r.source || '',
    };
  }));
}

const icsText = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const icsStamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
/** Dhaka wall-clock DATETIMEs from the table, written as UTC instants. */
const icsFromDhaka = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(`${String(value).slice(0, 19).replace(' ', 'T')}+06:00`);
  return Number.isNaN(d.getTime()) ? null : icsStamp(d);
};
const fold = (line) => {
  const out = [];
  let rest = line;
  while (rest.length > 73) { out.push(rest.slice(0, 73)); rest = ` ${rest.slice(73)}`; }
  out.push(rest);
  return out.join('\r\n');
};

/**
 * One VEVENT per advisory that has a start. A notice with no dates is a
 * standing message and belongs to the JSON feed, not a calendar.
 */
export function advisoriesIcs(advisories, { locale = 'en', host = 'dhakabypass.com', name = 'Dhaka Bypass Expressway', now = new Date() } = {}) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${host}//advisories//EN`, 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${icsText(name)}`];
  for (const a of advisories || []) {
    const start = icsFromDhaka(a.starts_at);
    if (!start) continue;
    const end = icsFromDhaka(a.ends_at);
    const summary = localeMessage(a, locale);
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:advisory-${a.id}@${host}`);
    lines.push(`DTSTAMP:${icsStamp(now)}`);
    lines.push(`DTSTART:${start}`);
    if (end) lines.push(`DTEND:${end}`);
    lines.push(fold(`SUMMARY:${icsText(summary)}`));
    lines.push(`CATEGORIES:${icsText(a.severity)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}
