/** Nearby label cards. Each card has the same leader reach and is placed
 * relative to its own point, rather than aligned to a page-wide label gutter. */
export function nearbyLabels(features, { zoom = 1, bounds = {x:0,y:0,w:1280,h:920}, compact = false, detailZoom = 1 } = {}) {
  const groups = [];
  for (const f of features) {
    if (!f.name) continue;
    const base = f.name.replace(/\s*\((?:RHS|LHS)\)\s*$/i, '').replace(/\s*\(A\)$/i, '');
    const group = detailZoom < 2 ? groups.find(g => g.kind === f.kind
      && g.name.replace(/\s+A$/i, '') === base && Math.hypot(g.x-f.x,g.y-f.y) < 60) : null;
    if (group) { group.count += 1; group.ids.push(f.id); }
    else groups.push({ ...f, name: detailZoom < 2 ? base : f.name, count: 1, ids: [f.id] });
  }
  const placed=[];
  for (const [i,f] of groups.entries()) {
    const detail=/\(K\d|unnamed|unconfirmed/i.test(f.name);
    if (detail && detailZoom < 2.2) continue;
    const displayName = compact ? f.name.replace(/ Toll Plaza| Bridge/g,'') : f.name;
    let side = i % 2 === 0 ? -1 : 1;
    const cardWidth = compact ? Math.min(160,Math.max(85, displayName.length * 6.4 + 35))
      : Math.min(252,Math.max(124, f.name.length * 7.5 + 46));
    const cardHeight = compact ? 28 : 34;
    let labelY=f.y;
    const reach=(compact?16:42)/zoom;
    const margin=8/zoom;
    if (side<0 && f.x-reach-cardWidth/zoom<bounds.x+margin) side=1;
    if (side>0 && f.x+reach+cardWidth/zoom>bounds.x+bounds.w-margin) side=-1;
    const candidates=[0,-40,40,-80,80];
    for (const shift of candidates) {
      const y=f.y+shift/zoom;
      const x=side<0?f.x-reach-cardWidth/zoom:f.x+reach;
      const overlaps=placed.some(p=>x<p.left+p.width/zoom+8/zoom&&x+cardWidth/zoom+8/zoom>p.left
        &&Math.abs(y-p.labelY)<(cardHeight+8)/zoom);
      if(!overlaps) {labelY=y;break;}
    }
    const left=side<0?f.x-reach-cardWidth/zoom:f.x+reach;
    placed.push({...f,displayName,side,labelY,left,width:cardWidth,height:cardHeight,
      labelX:side<0?left+cardWidth/zoom:left,detail});
  }
  return placed;
}

/** Small road shields avoid the corridor ribbons and the facility cards. */
export function roadBadges(roads, labels, line, zoom, bounds) {
  const result=[];
  for(const road of roads.filter(r=>r.ref)) {
    const near=line.reduce((best,p)=>Math.hypot(p.x-road.x,p.y-road.y)<Math.hypot(best.x-road.x,best.y-road.y)?p:best,line[0]);
    const side=road.x<near.x?-1:1;
    let chosen={x:road.x+side*40/zoom,y:road.y};
    for(const [dx,dy] of [[side*36,0],[0,-40],[0,40],[side*65,-20],[-side*60,20],[side*80,45],[side*95,-50]]) {
      const p={x:road.x+dx/zoom,y:road.y+dy/zoom};
      const onRoad=line.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<37/zoom);
      const onLabel=labels.some(f=>p.x+24/zoom>f.left&&p.x-24/zoom<f.left+f.width/zoom&&Math.abs(p.y-f.labelY)<31/zoom);
      const onBadge=result.some(q=>Math.abs(q.badgeX-p.x)<55/zoom&&Math.abs(q.badgeY-p.y)<28/zoom);
      if(!onRoad&&!onLabel&&!onBadge&&p.x>bounds.x+25/zoom&&p.x<bounds.x+bounds.w-25/zoom){chosen=p;break;}
    }
    result.push({...road,badgeX:chosen.x,badgeY:chosen.y});
  }
  return result;
}
