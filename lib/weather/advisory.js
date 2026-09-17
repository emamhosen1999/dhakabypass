/**
 * Turning a weather reading into a driving advisory.
 *
 * The thresholds are settings, edited at /admin/corridor, because the point
 * at which fog becomes a hazard on this alignment is DBEDC's call and may
 * move with experience; the defaults below are only what a fresh database
 * starts with (55-weather-settings.sql seeds the same three values).
 */
export const WEATHER_KEYS = Object.freeze({
  fog: 'weather.fog_visibility_m',
  rain: 'weather.heavy_rain_mm',
  wind: 'weather.strong_wind_kmh',
});

export const WEATHER_DEFAULTS = Object.freeze({ fog: 1000, rain: 7.5, wind: 50 });

/** Settings values -> numbers, with the default for anything unusable. */
export function normaliseThresholds(raw = {}) {
  const out = {};
  for (const key of Object.keys(WEATHER_DEFAULTS)) {
    const n = Number(raw?.[key]);
    out[key] = Number.isFinite(n) && n > 0 ? n : WEATHER_DEFAULTS[key];
  }
  return out;
}

/**
 * The WMO weather code, reduced to the words a driver needs. Snow codes
 * (71–77, 85–86) are folded into rain: they do not occur here, and a code
 * arriving anyway should still print something rather than "unknown".
 */
const number = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));

export function weatherWordKey(code) {
  const c = number(code);
  if (!Number.isFinite(c)) return 'wxUnknown';
  if (c === 0) return 'wxClear';
  if (c <= 3) return 'wxCloudy';
  if (c === 45 || c === 48) return 'wxFog';
  if (c >= 51 && c <= 57) return 'wxDrizzle';
  if ((c >= 61 && c <= 67) || (c >= 71 && c <= 77) || (c >= 80 && c <= 86)) return 'wxRain';
  if (c >= 95) return 'wxThunder';
  return 'wxUnknown';
}

/**
 * Which thresholds a reading crosses. A missing value crosses nothing: a
 * provider that did not report visibility must not read as fog.
 */
export function assess(reading, thresholds) {
  const th = normaliseThresholds(thresholds);
  const flags = [];
  const vis = number(reading?.visibilityM);
  const rain = number(reading?.rainMm);
  const wind = Math.max(number(reading?.windKmh) || 0, number(reading?.gustKmh) || 0);
  if (Number.isFinite(vis) && vis >= 0 && vis < th.fog) flags.push('fog');
  if (Number.isFinite(rain) && rain >= th.rain) flags.push('rain');
  if (Number.isFinite(wind) && wind >= th.wind) flags.push('wind');
  // A fog code from the provider counts even when visibility was not reported.
  if (!flags.includes('fog') && weatherWordKey(reading?.code) === 'wxFog') flags.push('fog');
  return { level: flags.length ? 'advisory' : 'clear', flags, thresholds: th };
}

/** The worst of several points' assessments: the corridor's advisory. */
export function combine(assessments) {
  const flags = new Set();
  for (const a of assessments || []) for (const f of a?.flags || []) flags.add(f);
  const ordered = ['fog', 'rain', 'wind'].filter((f) => flags.has(f));
  return { level: ordered.length ? 'advisory' : 'clear', flags: ordered };
}
