/** Build a local, attributed geographic basemap from an Overpass JSON export.
 * No tile scraping. OSM's vector data is simplified for display, and the
 * resulting database is published alongside the map under ODbL.
 * Usage: node scripts/build-corridor-context.mjs --file export.json
 */
import fs from 'node:fs/promises';
import { projectMercator, haversineMetres } from '../lib/corridor/map.js';
import { stitch, simplify, nearestOnLine, chainages, clipChainage, clipToTerminals } from '../lib/corridor/geometry-import.js';

const file = process.argv[process.argv.indexOf('--file') + 1];
if (!process.argv.includes('--file')) throw new Error('Supply an Overpass JSON export with --file');
const data = JSON.parse(await fs.readFile(file, 'utf8'));
if (data.remark) throw new Error(data.remark);
const elements = data.elements || [];
const isCorridor = (e) => /N105/.test(e.tags?.ref) || /Dhaka Bypass/i.test(e.tags?.name);
const point = (g) => ({ lat: g.lat, lng: g.lon });
const corridorWays = elements.filter(e => e.type === 'way' && e.geometry && isCorridor(e));
const corridor = stitch(corridorWays.map(e => e.geometry.map(point)),
  {lat:23.986737,lng:90.362246}, {lat:23.690500,lng:90.546722});
if (corridor.length < 2) throw new Error('The source has no continuous N105 alignment');
const roadLine = simplify(corridor, 2);
const corridorNodes = new Set(corridor.map(p => `${p.lat},${p.lng}`));
const pointKey = p => `${p.lat},${p.lng}`;
const roadEnds = new Map();
for(const road of elements.filter(e=>e.type==='way'&&e.tags?.highway&&e.geometry?.length>1&&!isCorridor(e))) {
  road.line=road.geometry.map(point);
  for(const p of [road.line[0],road.line.at(-1)]) {
    const key=pointKey(p); if(!roadEnds.has(key))roadEnds.set(key,[]); roadEnds.get(key).push(road);
  }
}
// Follow the same mapped road across OSM way boundaries. A way boundary is
// usually an editing boundary, not the end of a 2 km approach.
function extendRoad(line, road) {
  const extend = (seed) => {
    let result=seed.slice(); let used=new Set([road.id]); let added=0; let current=road;
    while(added<2000) {
      const end=result.at(-1), prev=result.at(-2);
      const candidates=(roadEnds.get(pointKey(end))||[]).filter(r=>!used.has(r.id)).map(r=>{
        const points=pointKey(r.line[0])===pointKey(end)?r.line:r.line.slice().reverse();
        const a={x:end.lng-prev.lng,y:end.lat-prev.lat},b={x:points[1].lng-end.lng,y:points[1].lat-end.lat};
        const cosine=(a.x*b.x+a.y*b.y)/(Math.hypot(a.x,a.y)*Math.hypot(b.x,b.y)||1);
        const sameRef=current.tags.ref&&current.tags.ref===r.tags.ref;
        const sameName=current.tags.name&&current.tags.name===r.tags.name;
        return {r,points,score:(sameRef?10:sameName?6:0)+cosine,cosine};
      }).filter(c=>c.cosine>-.1).sort((a,b)=>b.score-a.score);
      const pick=candidates[0];if(!pick)break;
      // An ambiguous fork with no road name/reference is not guessed.
      if(candidates[1]&&pick.score<2&&pick.score-candidates[1].score<.15)break;
      result.push(...pick.points.slice(1));used.add(pick.r.id);current=pick.r;
      added+=chainages(pick.points).at(-1).chainage_m;
    }
    return result;
  };
  const forward=extend(line); const reverse=extend(line.slice().reverse()).reverse();
  return reverse.slice(0,-line.length).concat(forward);
}
const topLeft = projectMercator(24.06, 90.20);
const bottomRight = projectMercator(23.62, 90.77);
const extent = { x:topLeft.x, y:topLeft.y, w:bottomRight.x-topLeft.x, h:bottomRight.y-topLeft.y };
const size = 2400; const height = size * extent.h / extent.w;
const xy = p => { const q=projectMercator(p.lat,p.lng); return [(q.x-extent.x)*size/extent.w,(q.y-extent.y)*size/extent.w]; };
const path = l => l.map((p,i)=>`${i?'L':'M'}${xy(p).map(n=>n.toFixed(1)).join(',')}`).join('');
const xml = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const layers = { land:[], water:[], minor:[], major:[], names:[] };
const places=[];
const features = []; const highlights = []; const junctions = [];

function intersection(a,b,c,d) {
  const rx=b.lng-a.lng, ry=b.lat-a.lat, sx=d.lng-c.lng, sy=d.lat-c.lat;
  const den=rx*sy-ry*sx;
  if (Math.abs(den)<1e-14) return null;
  const t=((c.lng-a.lng)*sy-(c.lat-a.lat)*sx)/den;
  const u=((c.lng-a.lng)*ry-(c.lat-a.lat)*rx)/den;
  return t>=0&&t<=1&&u>=0&&u<=1 ? {lat:a.lat+t*ry,lng:a.lng+t*rx} : null;
}

for (const e of elements) {
  const tags=e.tags||{};
  if (e.type==='node') {
    const name=tags['name:en'] || (/^[\x20-\x7e]+$/.test(tags.name||'') ? tags.name : '');
    if (name && tags.place) {
      const [x,y]=xy(point(e));
      places.push({x,y,name,priority:tags.place==='city'?0:tags.place==='town'?1:2});
    }
    continue;
  }
  if (!e.geometry || e.geometry.length<2) continue;
  const original=e.geometry.map(point);
  const simplified=simplify(original,tags.highway ? 9 : 18);
  const d=path(simplified);
  if(tags.highway) {
    const major=/^(motorway|trunk|primary|secondary|tertiary)(_link)?$/.test(tags.highway);
    (major?layers.major:layers.minor).push(d);
    if(!isCorridor(e) && !/^(construction|proposed|service)$/.test(tags.highway)) {
      const hits=[];
      for(let i=1;i<original.length;i++) {
        const a=original[i-1], b=original[i];
        for(let j=1;j<roadLine.length;j++) {
          const c=roadLine[j-1], f=roadLine[j];
          if(Math.max(a.lat,b.lat)<Math.min(c.lat,f.lat)||Math.min(a.lat,b.lat)>Math.max(c.lat,f.lat)
            ||Math.max(a.lng,b.lng)<Math.min(c.lng,f.lng)||Math.min(a.lng,b.lng)>Math.max(c.lng,f.lng))continue;
          const hit=intersection(a,b,c,f);
          if(hit&&!hits.some(h=>haversineMetres(h,hit)<70))hits.push(hit);
        }
      }
      // A road may terminate at the corridor without crossing its centreline.
      for(const p of [original[0],original.at(-1)]) {
        if(corridorNodes.has(`${p.lat},${p.lng}`)&&!hits.some(h=>haversineMetres(h,p)<70))hits.push(p);
      }
      const extended=hits.length?extendRoad(original,e):original;
      const measured=chainages(extended);
      for(const hit of hits) {
        const near=nearestOnLine(extended,hit);
        const at=measured[near.index].chainage_m+haversineMetres(extended[near.index],near.point);
        const connected=!tags.bridge&&!tags.tunnel&&(!tags.layer||tags.layer==='0')
          && original.some(p=>corridorNodes.has(`${p.lat},${p.lng}`)&&haversineMetres(p,hit)<35);
        const coordinates=simplify(clipChainage(extended,Math.max(0,at-2000),at+2000),5).map(p=>[p.lng,p.lat]);
        const name=tags['name:en']||tags.name||tags.ref||'';
        highlights.push({id:String(e.id),name,ref:tags.ref||'',highway:tags.highway,
          kind:connected?'connection':'crossing',major,position:[hit.lng,hit.lat],coordinates});
        junctions.push({lat:hit.lat,lng:hit.lng,kind:connected?'connection':'crossing',name});
      }
    }
  } else if(tags.natural==='water' || tags.waterway) {
    if(tags.natural==='water') {
      const projected=simplified.map(xy); const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
      if((Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys))<7) continue;
    }
    layers.water.push(`<path d="${d}${tags.natural==='water'?'Z':''}" fill="${tags.natural==='water'?'#b9d1dc':'none'}" stroke="#b9d1dc" stroke-width="${tags.waterway==='river'?5:1.6}"/>`);
  } else if(tags.landuse) {
    layers.land.push(`<path d="${d}Z" fill="${tags.landuse==='forest'?'#d6e2d5':'#dfe5e8'}"/>`);
  } else continue;
  const properties=Object.fromEntries(Object.entries(tags).filter(([key])=>['name','name:en','highway','waterway','natural','landuse','ref','bridge','tunnel','layer','oneway'].includes(key)));
  features.push({type:'Feature',id:e.id,properties,geometry:{type:'LineString',coordinates:simplified.map(p=>[p.lng,p.lat])}});
}
const named=[];
for(const place of places.sort((a,b)=>a.priority-b.priority)) {
  const width=place.name.length*12;
  if(named.some(n=>Math.abs(n.x-place.x)<(n.width+width)/2+35&&Math.abs(n.y-place.y)<62))continue;
  named.push({...place,width});
  layers.names.push(`<text x="${place.x.toFixed(1)}" y="${place.y.toFixed(1)}">${xml(place.name)}</text>`);
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${height.toFixed(2)}" viewBox="0 0 ${size} ${height.toFixed(2)}"><title>Dhaka region geographic basemap — © OpenStreetMap contributors, ODbL</title><rect width="100%" height="100%" fill="#eaf0f2"/>${layers.land.join('')}${layers.water.join('')}<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${layers.minor.join('')}" stroke="#c6d0d5" stroke-width="1"/><path d="${layers.major.join('')}" stroke="#c1cbd1" stroke-width="3.6"/><path d="${layers.major.join('')}" stroke="#f9fbfc" stroke-width="2"/></g><g fill="#71818c" font-family="Arial,sans-serif" font-size="24" font-weight="600" text-anchor="middle" stroke="#eaf0f2" stroke-width="4" paint-order="stroke">${layers.names.join('')}</g></svg>`;
await fs.mkdir('public/maps',{recursive:true});
await fs.mkdir('lib/corridor/data',{recursive:true});
await fs.writeFile('public/maps/corridor-geography.svg',svg);
const alignment = simplify(clipToTerminals(corridor,{lat:23.986737,lng:90.362246},{lat:23.690500,lng:90.546722}).line,5);
await fs.writeFile('public/maps/corridor-alignment.geojson',JSON.stringify({type:'Feature',properties:{source:'OpenStreetMap',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',date:data.osm3s?.timestamp_osm_base},geometry:{type:'LineString',coordinates:alignment.map(p=>[p.lng,p.lat])}}));
await fs.writeFile('public/maps/corridor-geography.geojson',JSON.stringify({type:'FeatureCollection',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',features}));
const metadata={extent,source:'OpenStreetMap',date:data.osm3s?.timestamp_osm_base||null,attribution:'© OpenStreetMap contributors',image:'/maps/corridor-geography.svg',download:'/maps/corridor-geography.geojson',highlights,junctions};
await fs.writeFile('lib/corridor/data/map-context.json',JSON.stringify(metadata));
console.log(JSON.stringify({features:features.length,highlights:highlights.length,junctions:junctions.length,svgKB:Math.round(svg.length/1024)}));
