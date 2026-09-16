import { withTransaction } from '../db.js';
import { getTrafficSource, listCorridorGeometry, listCorridorSections, listCorridorWaypoints } from './traffic.js';
import { sectionSamplePoints, fetchSectionFlows } from './tomtom.js';
import { sectionEndpoints, fetchSectionRoutes } from './google-routes.js';
import { validationError } from '../errors.js';

/**
 * Which live provider measures the corridor: Google's Routes API when its key
 * is set (it covers Bangladesh), TomTom otherwise (it does not, today).
 */
export function trafficProvider(env = process.env) {
  if (env.GOOGLE_ROUTES_API_KEY) return { name: 'google', key: env.GOOGLE_ROUTES_API_KEY };
  if (env.TOMTOM_API_KEY) return { name: 'tomtom', key: env.TOMTOM_API_KEY };
  return null;
}

export async function refreshTraffic() {
  const provider=trafficProvider();
  if(!provider)throw validationError('No traffic provider is configured on the server (GOOGLE_ROUTES_API_KEY).');
  const [sections,waypoints,geometry,originalSource]=await Promise.all([
    listCorridorSections(),listCorridorWaypoints(),listCorridorGeometry(),getTrafficSource(),
  ]);
  const flows=provider.name==='google'
    ? await fetchSectionRoutes(sectionEndpoints(sections,waypoints,geometry),{key:provider.key})
    : await fetchSectionFlows(sectionSamplePoints(sections,waypoints,geometry),{key:provider.key});
  await withTransaction(async q=>{
    const source=await q("SELECT CAST(value AS CHAR) AS value FROM site_settings WHERE setting_key='corridor.traffic_source' FOR UPDATE");
    const value=source[0]?.value;
    const current=typeof value==='string'?JSON.parse(value):value;
    if((current||'sample')!==originalSource)throw validationError('The data source changed during the refresh. Please review it and retry.');
    const currentSections=await q('SELECT id, condition_key, avg_speed_kmh, measured_at FROM corridor_sections ORDER BY sort_order, id FOR UPDATE');
    if(currentSections.length!==sections.length || currentSections.some((s,i)=>s.id!==sections[i].id
      ||String(s.measured_at)!==String(sections[i].measured_at)))throw validationError('Section measurements changed during the refresh. Please retry.');
    for(const flow of flows)await q('UPDATE corridor_sections SET condition_key=?, avg_speed_kmh=?, measured_at=CURRENT_TIMESTAMP WHERE id=?',[flow.condition,flow.speed,flow.id]);
    await q("INSERT INTO site_settings (setting_key,value) VALUES ('corridor.traffic_source',?) ON DUPLICATE KEY UPDATE value=VALUES(value)",[JSON.stringify(provider.name)]);
  });
  return flows.length;
}
