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

/**
 * Just enough to render the corridor's current condition as a table.
 *
 * A SEPARATE ENTRY FROM getMapTrafficCached ABOVE, deliberately. That reader
 * exists to draw the map, so it also carries `corridor_geometry` — thousands
 * of coordinate rows — plus twelve months of counts. The `traffic-status`
 * block needs none of that, and a block an operator can place on any page must
 * not drag the map's payload onto a page with no map on it.
 *
 * Same tag and same 60-second window as the map's reader, not a different one:
 * a status table and a map on the same page reading the same sections through
 * two different staleness windows would sooner or later disagree with each
 * other in front of a reader. `freshSections` is applied here too, so a TomTom
 * measurement that has gone stale reads "not measured" in the table exactly as
 * it does on the map rather than presenting an old speed as current.
 */
export const getSectionStatusCached = cache(() => unstable_cache(async () => {
  const [sections, waypoints, source] = await Promise.all([
    listCorridorSections(), listCorridorWaypoints(), getTrafficSource(),
  ]);
  return { sections: freshSections(sections, source), waypoints, source };
}, ['corridor-section-status'], { tags: [CORRIDOR_TAG], revalidate: 60 })());
