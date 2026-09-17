import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { listCorridorWaypoints } from '../corridor/traffic.js';
import { listInterchanges } from '../corridor/interchanges.js';
import { getSetting } from '../settings.js';
import { asJson, isPlainObject } from '../json.js';
import { fetchCorridorWeather } from './open-meteo.js';
import { WEATHER_KEYS, normaliseThresholds } from './advisory.js';

import { WEATHER_TAG } from '../revalidate.js';

const namesOf = (row) => {
  const names = asJson(row?.names, {});
  return isPlainObject(names) ? names : {};
};

/**
 * Three places along the road: its two ends, by their waypoint names, and
 * the plaza or interchange nearest the middle. Nothing is typed here: a
 * corridor whose records move takes its weather points with it.
 */
export function samplePoints(waypoints, interchanges) {
  const line = (Array.isArray(waypoints) ? waypoints : [])
    .filter((w) => Number.isFinite(Number(w?.lat)) && Number.isFinite(Number(w?.lng)))
    .sort((a, b) => Number(a.chainage_m) - Number(b.chainage_m));
  if (line.length === 0) return [];
  const asPoint = (row) => ({
    lat: Number(row.lat), lng: Number(row.lng), chainage_m: Number(row.chainage_m) || 0, names: namesOf(row),
  });
  const points = [asPoint(line[0])];
  if (line.length > 1) {
    const midM = (Number(line[0].chainage_m) + Number(line[line.length - 1].chainage_m)) / 2;
    const candidates = (Array.isArray(interchanges) ? interchanges : [])
      .filter((r) => (r?.kind === 'toll_plaza' || r?.kind === 'interchange')
        && Number.isFinite(Number(r.lat)) && Number.isFinite(Number(r.lng)));
    let mid = null;
    for (const r of candidates) {
      if (!mid || Math.abs(Number(r.chainage_m) - midM) < Math.abs(Number(mid.chainage_m) - midM)) mid = r;
    }
    if (mid) points.push(asPoint(mid));
    points.push(asPoint(line[line.length - 1]));
  }
  return points;
}

export async function readThresholds() {
  const raw = {};
  for (const [name, key] of Object.entries(WEATHER_KEYS)) raw[name] = await getSetting(key, null);
  return normaliseThresholds(raw);
}

/**
 * Ten minutes: Open-Meteo updates hourly, and a reader refreshing the page
 * during fog wants a figure that moves, not one frozen for the hour.
 */
export const getCorridorWeatherCached = cache(() => unstable_cache(async () => {
  const [waypoints, interchanges, thresholds] = await Promise.all([
    listCorridorWaypoints(), listInterchanges().catch(() => []), readThresholds(),
  ]);
  const weather = await fetchCorridorWeather(samplePoints(waypoints, interchanges));
  return { weather, thresholds };
}, ['corridor-weather'], { tags: [WEATHER_TAG], revalidate: 600 })());
