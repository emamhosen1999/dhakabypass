/**
 * Open-Meteo, keyless, for a handful of points along the corridor.
 *
 * One request carries every point (the API accepts comma-separated
 * coordinates and answers with one object per point). `current` gives the
 * last hour's rain, the wind and the WMO code; visibility is an hourly
 * variable only, so the current hour is picked out of today's hourly series
 * by its timestamp in Dhaka time. A failure of any kind resolves to null and
 * the block renders its unavailable state; it never throws on a page.
 */
export const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
export const WEATHER_ATTRIBUTION = 'Open-Meteo';
const TIME_ZONE = 'Asia/Dhaka';
const TIMEOUT_MS = 6000;

const num = (v) => (v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null);

export function weatherUrl(points) {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set('latitude', points.map((p) => Number(p.lat).toFixed(4)).join(','));
  url.searchParams.set('longitude', points.map((p) => Number(p.lng).toFixed(4)).join(','));
  url.searchParams.set('current', 'temperature_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m');
  url.searchParams.set('hourly', 'visibility');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('timezone', TIME_ZONE);
  return url.toString();
}

/** The hourly visibility for the hour `current.time` falls in, or null. */
export function visibilityAt(hourly, currentTime) {
  const times = Array.isArray(hourly?.time) ? hourly.time : [];
  const values = Array.isArray(hourly?.visibility) ? hourly.visibility : [];
  const hour = typeof currentTime === 'string' ? currentTime.slice(0, 13) : '';
  if (!hour) return null;
  const i = times.findIndex((t) => typeof t === 'string' && t.slice(0, 13) === hour);
  return i >= 0 ? num(values[i]) : null;
}

/** One API result object -> the reading the block prints. */
export function shapeReading(result) {
  const c = result?.current || {};
  return {
    time: typeof c.time === 'string' ? c.time : null,
    temperatureC: num(c.temperature_2m),
    rainMm: num(c.precipitation),
    code: num(c.weather_code),
    windKmh: num(c.wind_speed_10m),
    gustKmh: num(c.wind_gusts_10m),
    visibilityM: visibilityAt(result?.hourly, c.time),
  };
}

export async function fetchCorridorWeather(points, { fetchImpl = fetch } = {}) {
  const usable = (Array.isArray(points) ? points : [])
    .filter((p) => Number.isFinite(Number(p?.lat)) && Number.isFinite(Number(p?.lng)));
  if (usable.length === 0) return null;
  try {
    const res = await fetchImpl(weatherUrl(usable), {
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    const body = await res.json();
    const results = Array.isArray(body) ? body : [body];
    if (results.length !== usable.length) return null;
    return {
      fetchedAt: new Date().toISOString(),
      attribution: WEATHER_ATTRIBUTION,
      points: usable.map((p, i) => ({ ...p, reading: shapeReading(results[i]) })),
    };
  } catch {
    return null;
  }
}
