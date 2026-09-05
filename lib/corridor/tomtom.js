import { nearestOnLine, clipToTerminals, chainages, clipChainage } from './geometry-import.js';
import { validationError } from '../errors.js';

export const TOMTOM_FRESH_MS = 15 * 60 * 1000;

export function flowCondition(currentSpeed, freeFlowSpeed, closed) {
  if (closed) return 'closed';
  const ratio=currentSpeed/freeFlowSpeed;
  return ratio<.3?'heavy':ratio<.6?'slow':ratio<.85?'moderate':'free';
}

/** A nearby street must not supply a motorway's traffic reading. */
export function parseFlow(payload, point) {
  const flow=payload?.flowSegmentData;
  if(!flow || typeof flow.roadClosure!=='boolean' || !Number.isFinite(flow.currentSpeed)
    || flow.currentSpeed<0 || flow.currentSpeed>250 || !Number.isFinite(flow.freeFlowSpeed)
    || flow.freeFlowSpeed<=0 || flow.freeFlowSpeed>250 || !Number.isFinite(flow.confidence)
    || flow.confidence<.7 || flow.confidence>1 || !['FRC0','FRC1','FRC2','FRC3'].includes(flow.frc)) {
    throw validationError('TomTom did not return a usable traffic measurement for every section.');
  }
  const line=(flow.coordinates?.coordinate||[]).map(p=>({lat:p.latitude,lng:p.longitude}));
  if(line.length<2 || line.some(p=>!Number.isFinite(p.lat)||!Number.isFinite(p.lng))
    || nearestOnLine(line,point).metres>100) {
    throw validationError('A TomTom measurement could not be matched to the corridor.');
  }
  return {condition:flowCondition(flow.currentSpeed,flow.freeFlowSpeed,flow.roadClosure),
    speed:flow.roadClosure?0:Math.round(flow.currentSpeed)};
}

export function sectionSamplePoints(sections, waypoints, geometry) {
  if(geometry.length<2) throw validationError('Import the road alignment before refreshing traffic.');
  const line=geometry.map(p=>({lat:Number(p.lat),lng:Number(p.lng)}));
  return sections.map(section=>{
    const from=waypoints.find(w=>w.code===section.from_code),to=waypoints.find(w=>w.code===section.to_code);
    if(!from||!to)throw validationError('A section is missing a waypoint.');
    const clipped=clipToTerminals(line,{lat:Number(from.lat),lng:Number(from.lng)}, {lat:Number(to.lat),lng:Number(to.lng)}).line;
    const length=chainages(clipped).at(-1)?.chainage_m||0;
    if(length<=0)throw validationError('A section could not be matched to the imported road.');
    const point=clipChainage(clipped,length/2,length/2+1)[0];
    return {id:section.id,point};
  });
}

export async function fetchSectionFlows(samples, { key, fetchImpl=fetch }={}) {
  if(!key)throw validationError('TOMTOM_API_KEY is not configured on the server.');
  if(!samples.length)throw validationError('There are no sections to refresh.');
  return Promise.all(samples.map(async sample=>{
    const url=new URL('https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/15/json');
    url.search=new URLSearchParams({key,point:`${sample.point.lat},${sample.point.lng}`,unit:'kmph'}).toString();
    let response;
    try {response=await fetchImpl(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});}
    catch {throw validationError('TomTom could not be reached. Existing measurements were kept.');}
    if(!response.ok)throw validationError(`TomTom returned HTTP ${response.status}. Existing measurements were kept.`);
    let payload;
    try {payload=await response.json();}catch {throw validationError('TomTom returned an unreadable response.');}
    return {id:sample.id,...parseFlow(payload,sample.point)};
  }));
}

export function freshSections(sections, source, now=Date.now()) {
  if(source!=='tomtom')return sections;
  return sections.map(s=>{
    const at=new Date(s.measured_at).getTime();
    return !Number.isFinite(at)||!s.measured_at||now-at>TOMTOM_FRESH_MS||at>now+60000
      ? {...s,condition_key:'unknown',avg_speed_kmh:null}:s;
  });
}
