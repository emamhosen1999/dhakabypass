import { nearbyLabels, roadBadges } from '../../lib/corridor/map-labels.js';

/** Geographic drawing with a sourced centreline and diagrammatic lane widths. */
export default function CorridorMap({
  view, viewBox, hovered, selected, onHoverSection, onSelectSection,
  connections = true, landmarks = true, traffic = false, pixelWidth = view.width,
  activeRoad = null, onHoverRoad, onSelectRoad,
}) {
  if (!view?.ok) return null;
  const active = hovered || selected;
  const zoom = pixelWidth / Number((viewBox || view.viewBox).split(' ')[2]);
  const [vx,vy,vw,vh] = (viewBox || view.viewBox).split(' ').map(Number);
  const compact = pixelWidth < 600;
  const detailZoom = (compact ? 720 : view.width) / vw;
  const labels = nearbyLabels(view.facilities, { zoom, compact, detailZoom, bounds:{x:vx,y:vy,w:vw,h:vh} });
  const roadStyle = { vectorEffect: 'non-scaling-stroke' };
  const geo = view.geography;
  const badges = roadBadges(geo.roads,labels,view.linePoints,zoom,{x:vx,y:vy,w:vw,h:vh});
  return (
    <svg className="db-map" viewBox={viewBox || view.viewBox} role="img" aria-label={view.alt} preserveAspectRatio="xMidYMid meet">
      <defs><pattern id="db-map-closed" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="8" fill="var(--db-ink-3)"/><rect width="4" height="8" fill="var(--db-surface-2)"/>
      </pattern></defs>
      <image className="db-map-geography" href={detailZoom > 2 ? geo.image : geo.overviewImage || geo.image} x={geo.x} y={geo.y} width={geo.width} height={geo.height} preserveAspectRatio="none"/>
      {connections ? <g className="db-map-approaches">{geo.highlights.map(r =>
        <a key={r.id} href="#map-roads" aria-hidden="true" tabIndex={-1}
          onMouseEnter={()=>onHoverRoad?.(r.roadId)} onMouseLeave={()=>onHoverRoad?.(null)}
          onClick={onSelectRoad?e=>{e.preventDefault();onSelectRoad(r.roadId);}:undefined}>
          <title>{`${r.roadId} · ${r.name || (r.kind === 'connection' ? 'Connecting road' : 'Crossing road')}`}</title>
          <path d={r.d} className="db-map-road-hit" style={roadStyle}/>
          <path d={r.d} className={`db-map-approach is-${r.kind}${r.major?' is-major':''}${activeRoad===r.roadId?' is-active':''}`} style={roadStyle}/>
        </a>)}
      </g> : null}
      {connections ? <g className="db-map-road-badges">{badges.map(r=><a key={r.id}
        href="#map-roads" aria-hidden="true" tabIndex={-1} onMouseEnter={()=>onHoverRoad?.(r.id)} onMouseLeave={()=>onHoverRoad?.(null)}
        onClick={onSelectRoad?e=>{e.preventDefault();onSelectRoad(r.id);}:undefined}>
        <title>{`${r.ref} · ${r.name}`}</title>
        <path d={`M${r.x},${r.y} L${r.badgeX},${r.badgeY}`} className="db-map-road-badge-leader" style={roadStyle}/>
        <g transform={`translate(${r.badgeX},${r.badgeY}) scale(${1/zoom})`}>
          <rect x="-22" y="-11" width="44" height="22" rx="5"/>
          <text y="1" textAnchor="middle" dominantBaseline="central">{r.ref}</text>
        </g>
      </a>)}</g>:null}
      <g className="db-map-road" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path d={view.d} stroke="var(--map-edge)" strokeWidth="24" style={roadStyle}/>
        <path d={view.d} stroke="var(--map-service)" strokeWidth="21" style={roadStyle}/>
        <path d={view.d} stroke="var(--map-edge)" strokeWidth="16" style={roadStyle}/>
        <path d={view.d} className="db-map-casing" stroke="var(--map-toll)" strokeWidth="12" style={roadStyle}/>
        <path d={view.d} stroke="var(--map-median)" strokeWidth="2" style={roadStyle}/>
      </g>
      {view.sections.map(s => <a key={s.id} href={`#sec-${s.id}`}
        className={`db-map-hit${active === s.id ? ' is-active' : ''}`} aria-hidden="true" tabIndex={-1}
        onMouseEnter={onHoverSection ? () => onHoverSection(s.id) : undefined}
        onMouseLeave={onHoverSection ? () => onHoverSection(null) : undefined}
        onClick={onSelectSection ? e => { e.preventDefault(); onSelectSection(s.id); } : undefined}>
        <title>{s.title}</title><path d={s.d} className="db-map-hitarea" style={roadStyle}/>
        <path d={s.d} className="db-map-section" stroke={active === s.id ? 'var(--map-selection)' : s.stroke}
          style={{ ...roadStyle, opacity: active === s.id ? 0.85 : traffic ? 0.8 : 0 }}/>
      </a>)}
      <g className="db-map-direction" pointerEvents="none">
        {view.linePoints.filter((_, i) => i % 16 === 5).map((p, i) => {
          const index = i * 16 + 5; const next = view.linePoints[Math.min(index + 1, view.linePoints.length - 1)];
          const angle = Math.atan2(next.y - p.y, next.x - p.x) * 180 / Math.PI;
          return <g key={index} transform={`translate(${p.x},${p.y}) rotate(${angle}) scale(${1 / zoom})`}>
            <path d="M-3,-5 L3,-5 M0,-8 L3,-5 L0,-2"/><path d="M3,5 L-3,5 M0,2 L-3,5 L0,8"/>
          </g>;
        })}
      </g>
      {connections && detailZoom > 1.6 ? <g pointerEvents="none">{geo.junctions.map((j, i) =>
        <g key={i} transform={`translate(${j.x},${j.y}) scale(${1 / zoom})`}>
          {j.kind === 'connection' ? <circle r="4" className="db-map-connection-dot"/>
            : <path d="M-7,-5 L7,-5 M-7,5 L7,5" className="db-map-crossing-mark"/>}
        </g>)}
      </g> : null}
      {landmarks ? <g className="db-map-landmarks" pointerEvents="none">
        {detailZoom > 2 ? view.features.map(f => <g key={f.id} transform={`translate(${f.x},${f.y}) scale(${1 / zoom})`}>
          <circle r="4" className={`db-map-feature db-map-feature-${f.kind}${f.pending ? ' db-map-feature-pending' : ''}`}/>
        </g>) : null}
        {labels.map(f => <g key={f.id} className={`db-map-label${f.detail ? ' is-detail' : ''}`}>
          <path d={`M${f.x},${f.y} L${f.labelX},${f.labelY}`} className="db-map-leader" style={roadStyle}/>
          <g transform={`translate(${f.left},${f.labelY}) scale(${1 / zoom})`}>
            <rect x="0" y={-f.height/2} width={f.width} height={f.height} rx="7" className="db-map-label-card"/>
            <rect x="7" y="-11" width="23" height="22" rx="5" className={`db-map-label-icon is-${f.kind}`}/>
            {f.kind === 'toll_plaza' ? <path d="M12,5V-4H25V5M11,-7H26M18,-4V5" className="db-map-icon-line"/>
              : f.kind === 'bridge' ? <path d="M11,4H26M13,3V-6M24,3V-6M13,-3Q18,-10 24,-3" className="db-map-icon-line"/>
                : <circle cx="18.5" cy="0" r="4" className="db-map-icon-line"/>}
            <text x={compact?34:37} y="1" dominantBaseline="central" className="db-map-label-text" style={{fontSize:compact?11:14}}>{f.displayName}</text>
          </g>
        </g>)}
      </g> : null}
      {view.waypoints.map(w => <g key={w.code} transform={`translate(${w.x},${w.y}) scale(${1 / zoom})`} className="db-map-wp">
        {(w.terminal || detailZoom > 1.8) ? <>
          <circle r={w.terminal ? 11 : 8} className={w.terminal ? 'db-map-terminal' : 'db-map-wp-dot'}/>
          <text textAnchor="middle" dominantBaseline="central" className={`db-map-wp-label${w.terminal ? ' db-map-wp-label-terminal' : ''}`}>{w.code}</text>
        </> : null}
        {w.terminal ? <g transform={`translate(${compact ? (w.code==='S'?22:-22) : (w.code === 'S' ? -26 : 26)},${w.code === 'S' ? -28 : 28})`}>
          <text className="db-map-terminal-name" textAnchor={(w.code === 'S') !== compact ? 'end' : 'start'}>{w.name.replace(/\s*\(.*?\)|（.*?）/g, '')}</text>
          <text y="18" className="db-map-terminal-distance" textAnchor={(w.code === 'S') !== compact ? 'end' : 'start'}>{w.chainageLabel}</text>
        </g> : null}
      </g>)}
    </svg>
  );
}
