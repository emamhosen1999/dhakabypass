import { getSectionStatusCached } from '../../../../lib/corridor/traffic-cache.js';
import { getActiveAdvisoriesCached, getInterchangesCached } from '../../../../lib/corridor/cache.js';
import { corridorStatusPayload } from '../../../../lib/open-data/format.js';
import { respondOpenData, preflight } from '../../../../lib/open-data/respond.js';

/**
 * Open data: how the corridor is running, as JSON. The same cached readers
 * the map and the status table use, so the feed and the page never
 * disagree, and the `traffic_source` flag travels with the figures so a
 * consumer can tell sample conditions from measured ones.
 */
export const dynamic = 'force-dynamic';

export async function GET(request) {
  return respondOpenData(request, async () => {
    const [status, advisories, interchanges] = await Promise.all([
      getSectionStatusCached(), getActiveAdvisoriesCached().catch(() => []), getInterchangesCached().catch(() => []),
    ]);
    const payload = corridorStatusPayload({
      sections: status.sections, waypoints: status.waypoints, source: status.source, advisories, interchanges,
    });
    return { body: JSON.stringify(payload), contentType: 'application/json; charset=utf-8' };
  }, { name: 'open-data.status' });
}

export const OPTIONS = preflight;
