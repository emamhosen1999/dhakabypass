import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { CORRIDOR_TAG } from '../revalidate.js';
import { freshSections } from './tomtom.js';
import {
  listCorridorWaypoints, listCorridorSections, listMonthlyTraffic,
  listCorridorGeometry, getGeometrySource, getTrafficSource, getMonthlyTrafficSource,
} from './traffic.js';

// Every reader on the map participates in the admin's corridor invalidation.
// The time limit also refreshes geometry imported outside the Next process.
export const getMapTrafficCached = cache(() => unstable_cache(async () => {
  const [waypoints, sections, monthly, geometry, geoSource, source, monthlySource] = await Promise.all([
    listCorridorWaypoints(), listCorridorSections(), listMonthlyTraffic({ limit: 12 }),
    listCorridorGeometry(), getGeometrySource(), getTrafficSource(), getMonthlyTrafficSource(),
  ]);
  return { waypoints, sections:freshSections(sections,source), monthly, geometry, geoSource, source, monthlySource };
}, ['corridor-map-data'], { tags: [CORRIDOR_TAG], revalidate: 60 })());
