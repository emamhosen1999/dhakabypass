'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CorridorMap from './CorridorMap.jsx';

/**
 * The interactive layer over the corridor map.
 *
 * PROGRESSIVE ENHANCEMENT, NOT A REPLACEMENT. Everything below is behaviour
 * added to a drawing that is already complete: the server renders the same SVG
 * and the same section list, the section paths are anchors to the list rows,
 * and the rows carry `:target` styling. With JavaScript off a reader can still
 * click a stretch of road and land on what it is. With JavaScript they get zoom,
 * pan, hover linkage and zoom-to-section on top.
 *
 * WHY NO MAP LIBRARY, AGAIN. Pan and zoom over an SVG is a viewBox and about
 * eighty lines of pointer handling. Leaflet is 42KB gzipped and MapLibre is
 * 200KB+, both of them to move a rectangle. The budget for this page is a
 * throttled 3G profile.
 *
 * The zoom is a VIEWPORT zoom: strokes and labels scale with the drawing, the
 * way zooming a printed map does. It does not fetch more detail, because there
 * is no more detail to fetch — the geometry is everything the survey and the
 * imported centreline contain, and pretending otherwise by revealing invented
 * fine structure at high zoom is the failure mode this whole page avoids.
 */

/** The furthest in the map will go: 12x, past which the line is wider than the road. */
const MAX_ZOOM = 12;
/** One step of the +/- buttons. */
const STEP = 1.6;

export default function CorridorExplorer({ view, ui, initialSelected = null }) {
  const [pixelWidth, setPixelWidth] = useState(view.width);
  const compact = pixelWidth < 600;
  const home = useMemo(() => {
    const [x, y, w, h] = String(view.viewBox).split(' ').map(Number);
    return compact ? { x: w / 2 - 360, y: -180, w: 720, h: 1200 } : { x, y, w, h };
  }, [view.viewBox, compact]);

  const [box, setBox] = useState(home);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(initialSelected);
  const [enhanced, setEnhanced] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [connections, setConnections] = useState(true);
  const [landmarks, setLandmarks] = useState(true);
  const [traffic, setTraffic] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [hoveredRoad, setHoveredRoad] = useState(null);
  const activeRoad = view.geography.roads.find(r=>r.id===(hoveredRoad||selectedRoad));
  const frameRef = useRef(null);
  const drag = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const suppressClick = useRef(false);

  // The controls appear only once this component is running, so a reader
  // without JavaScript is never shown a zoom button that does nothing.
  useEffect(() => { setEnhanced(true); }, []);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setPixelWidth(entry.contentRect.width));
    if (frameRef.current) observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { setBox(home); }, [home]);

  const clamp = useCallback((next) => {
    const minW = home.w / MAX_ZOOM;
    const w = Math.min(home.w, Math.max(minW, next.w));
    const h = w * (home.h / home.w);
    // Keep the drawing overlapping the viewport: panning is free within the
    // frame plus half a screen, so the corridor can never be lost off-screen
    // with no way back except the reset button.
    const slackX = home.w * 0.5;
    const slackY = home.h * 0.5;
    return {
      w,
      h,
      x: Math.min(home.x + home.w + slackX - w, Math.max(home.x - slackX, next.x)),
      y: Math.min(home.y + home.h + slackY - h, Math.max(home.y - slackY, next.y)),
    };
  }, [home]);

  /** Zoom by `factor` about a point given in SVG units. */
  const zoomAbout = useCallback((factor, cx, cy) => {
    setBox((b) => {
      const w = Math.min(home.w, Math.max(home.w / MAX_ZOOM, b.w / factor));
      const h = w * home.h / home.w;
      // Hold the anchor point still: its fractional position in the box does
      // not change, so the map grows under the cursor rather than under the
      // corner.
      const fx = (cx - b.x) / b.w;
      const fy = (cy - b.y) / b.h;
      return clamp({ x: cx - fx * w, y: cy - fy * h, w, h });
    });
  }, [clamp, home]);

  /** Client coordinates -> SVG units, via the frame's own box. */
  const toSvg = useCallback((clientX, clientY) => {
    const el = frameRef.current?.querySelector('svg');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    // preserveAspectRatio="xMidYMid meet": the drawing is letterboxed inside
    // the frame, so the scale is the smaller of the two and the leftover is
    // split evenly. Ignoring that puts the zoom anchor off by the letterbox.
    const scale = Math.min(r.width / box.w, r.height / box.h);
    const offX = (r.width - box.w * scale) / 2;
    const offY = (r.height - box.h * scale) / 2;
    return {
      x: box.x + (clientX - r.left - offX) / scale,
      y: box.y + (clientY - r.top - offY) / scale,
      scale,
    };
  }, [box]);

  const onWheel = useCallback((e) => {
    if (!enhanced) return;
    e.preventDefault();
    const p = toSvg(e.clientX, e.clientY);
    if (!p) return;
    zoomAbout(e.deltaY < 0 ? 1.18 : 1 / 1.18, p.x, p.y);
  }, [enhanced, toSvg, zoomAbout]);

  // Wheel has to be bound natively: React's onWheel is passive, so
  // preventDefault inside it does not stop the page scrolling under the map.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return undefined;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const onPointerDown = (e) => {
    if (!enhanced || e.button !== 0 || e.target.closest('[data-map-ui]')) return;
    if (!pointers.current.size) suppressClick.current = false;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y), box,
        anchor: toSvg((a.x + b.x) / 2, (a.y + b.y) / 2),
      };
      suppressClick.current = true;
      drag.current = null;
      setDragging(false);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    const p = toSvg(e.clientX, e.clientY);
    if (!p) return;
    drag.current = { startX: e.clientX, startY: e.clientY, box, scale: p.scale, moved: false };
    // Capture only after movement. Capturing on pointerdown retargets the
    // subsequent click to the frame, swallowing SVG links and zoom controls.
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const initial = pinch.current;
      if (initial.dist > 0 && initial.anchor) {
        const r = frameRef.current.querySelector('svg').getBoundingClientRect();
        const w = Math.min(home.w, Math.max(home.w / MAX_ZOOM, initial.box.w * initial.dist / dist));
        const h = w * home.h / home.w;
        const fx = ((a.x + b.x) / 2 - r.left) / r.width;
        const fy = ((a.y + b.y) / 2 - r.top) / r.height;
        setBox(clamp({ x: initial.anchor.x - fx * w, y: initial.anchor.y - fy * h, w, h }));
      }
      return;
    }

    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / d.scale;
    const dy = (e.clientY - d.startY) / d.scale;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 4) return;
    d.moved = true;
    suppressClick.current = true;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    setBox(clamp({ ...d.box, x: d.box.x - dx, y: d.box.y - dy }));
  };

  const endPointer = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    drag.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  /** Frame one section, with a margin so it is not flush against the edge. */
  const zoomToSection = useCallback((id) => {
    const s = view.sections.find((x) => x.id === id);
    if (!s || !s.bbox) return;
    const pad = Math.max(s.bbox.w, s.bbox.h) * 0.35 + 40;
    const w = Math.max(s.bbox.w + pad * 2, (s.bbox.h + pad * 2) * (home.w / home.h));
    setBox(clamp({
      x: s.bbox.x + s.bbox.w / 2 - w / 2,
      y: s.bbox.y + s.bbox.h / 2 - (w * (home.h / home.w)) / 2,
      w,
      h: w * (home.h / home.w),
    }));
  }, [view.sections, home, clamp]);

  const selectSection = useCallback((id) => {
    if (selected === id) { setBox(home); setSelected(null); }
    else { zoomToSection(id); setSelected(id); }
  }, [home, zoomToSection, selected]);

  const changed = Math.abs(box.w - home.w) > 0.5 || Math.abs(box.x - home.x) > 0.5 || Math.abs(box.y - home.y) > 0.5;
  const viewBox = `${box.x.toFixed(2)} ${box.y.toFixed(2)} ${box.w.toFixed(2)} ${box.h.toFixed(2)}`;
  const pixelsPerMetre=pixelWidth/box.w/view.metresPerUnit;
  const scaleMetres=[20000,10000,5000,2000,1000,500,200,100,50].find(m=>m*pixelsPerMetre<=130)||50;
  const scaleText=new Intl.NumberFormat(ui.locale||'en').format(scaleMetres>=1000?scaleMetres/1000:scaleMetres)
    +' '+(scaleMetres>=1000?ui.kmUnit:ui.mUnit);

  return (
    <div className="db-map-explorer">
      <div
        className={`db-map-wrap${enhanced ? ' is-enhanced' : ''}${dragging ? ' is-dragging' : ''}`}
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onClickCapture={(e) => {
          if (suppressClick.current && !e.target.closest('[data-map-ui]')) {
            e.preventDefault(); e.stopPropagation();
          }
          suppressClick.current = false;
        }}
        style={{ aspectRatio: `${home.w} / ${home.h}` }}
      >
        <CorridorMap
          view={view}
          viewBox={enhanced ? viewBox : view.viewBox}
          hovered={hovered}
          selected={selected}
          connections={connections}
          landmarks={landmarks}
          traffic={traffic}
          pixelWidth={pixelWidth}
          activeRoad={activeRoad?.id}
          onHoverRoad={enhanced?setHoveredRoad:undefined}
          onSelectRoad={enhanced?id=>setSelectedRoad(selectedRoad===id?null:id):undefined}
          onHoverSection={enhanced ? setHovered : undefined}
          onSelectSection={enhanced ? selectSection : undefined}
        />

        {enhanced ? (
          <div className="db-map-controls" data-map-ui>
            <button type="button" onClick={() => zoomAbout(STEP, box.x + box.w / 2, box.y + box.h / 2)}
                    aria-label={ui.zoomIn}>+</button>
            <button type="button" onClick={() => zoomAbout(1 / STEP, box.x + box.w / 2, box.y + box.h / 2)}
                    aria-label={ui.zoomOut}>−</button>
            <button type="button" className="db-map-reset"
                    onClick={() => { setBox(home); setSelected(null); setSelectedRoad(null); setHoveredRoad(null); }}
                    disabled={!changed && !selected && !selectedRoad} aria-label={`${ui.resetShort}: ${ui.resetView}`}>
              {ui.resetShort}
            </button>
          </div>
        ) : null}

        <div className="db-map-titleplate" data-map-ui><strong>{ui.title}</strong><span>N105 · {ui.subtitle}</span></div>
        {enhanced ? <div className="db-map-layers" data-map-ui>
          <span className="db-map-active-layer">{ui.map}</span>
          <button type="button" aria-expanded={layersOpen} onClick={() => setLayersOpen(!layersOpen)}>{ui.layers}<span aria-hidden="true"> ▱</span></button>
          {layersOpen ? <div className="db-map-layer-options">
            <label><input type="checkbox" checked={landmarks} onChange={e => setLandmarks(e.target.checked)}/>{ui.landmarks}</label>
            <label><input type="checkbox" checked={connections} onChange={e => setConnections(e.target.checked)}/>{ui.connections}</label>
            <label><input type="checkbox" checked={traffic} onChange={e => setTraffic(e.target.checked)}/>{ui.traffic}</label>
          </div> : null}
        </div> : null}
        {activeRoad ? <div className="db-map-road-card" data-map-ui>
          <button type="button" aria-label={ui.closeRoad} onClick={()=>{setSelectedRoad(null);setHoveredRoad(null);}}>×</button>
          <span className="db-map-road-code">{activeRoad.ref||ui.local}</span><small>{ui[activeRoad.category]}</small>
          <strong>{activeRoad.name||ui.local}</strong>
          <p>{activeRoad.kinds.length>1?ui.roadBoth:activeRoad.kinds[0]==='crossing'?ui.crossing:ui.connected}</p>
          <p className="db-map-road-access">{ui.roadAccess}</p>
          <a href={activeRoad.source} target="_blank" rel="noreferrer">{ui.roadSource} ↗</a>
        </div> : <div className="db-map-lane-inset" data-map-ui>
          <strong>{ui.laneTitle}</strong>
          <div className="db-map-lane-sample" aria-hidden="true"><i>↑</i><i>↑</i><i>↓</i><i>↓</i></div>
          <div className="db-map-lane-caption"><span>{ui.service}</span><span>{ui.toll}</span><span>{ui.service}</span></div>
          <small>{ui.laneNote}</small>
        </div>}
        <div className="db-map-mini-legend" data-map-ui>
          <span><i className="is-toll"/>{ui.toll}</span><span><i className="is-service"/>{ui.service}</span>
          <span><i className="is-crossing"/>{ui.crossing}</span><span><i className="is-connected"/>{ui.connected}</span>
          <small>{ui.highlight}</small>
        </div>
        <div className="db-map-north-fixed" aria-hidden="true"><span>↑</span>{ui.north}</div>
        <div className="db-map-scale-fixed" aria-hidden="true"><span style={{width:scaleMetres*pixelsPerMetre}}/>{scaleText}</div>
        <p className="db-map-credit" data-map-ui><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a><span> · </span><a href={view.geography.download}>{ui.data}</a></p>
      </div>

      <details className="db-panel db-map-road-list" id="map-roads">
        <summary className="db-panel-title">{ui.connections}</summary>
        <ul>{view.geography.roads.slice().sort((a,b)=>Number(Boolean(b.ref))-Number(Boolean(a.ref))||a.name.localeCompare(b.name)).map(r=><li key={r.id}>
          <button type="button" aria-pressed={selectedRoad===r.id} onClick={()=>{
            setConnections(true);setSelectedRoad(r.id);
            if(r.bbox){const w=Math.max(r.bbox.w+200,(r.bbox.h+200)*home.w/home.h);
              setBox(clamp({x:r.bbox.x+r.bbox.w/2-w/2,y:r.bbox.y+r.bbox.h/2-w*home.h/home.w/2,w,h:w*home.h/home.w}));}
            frameRef.current?.scrollIntoView({block:'center',behavior:'instant'});
          }}><span className="db-map-road-code">{r.ref||'—'}</span><span><strong>{r.name||ui.local}</strong><small>{ui[r.category]} · {r.kinds.length>1?ui.roadBoth:r.kinds[0]==='crossing'?ui.crossing:ui.connected}</small></span></button>
        </li>)}</ul>
      </details>

      {/* The accessible equivalent of the map, and the control surface for it:
          every section is a real button, in the tab order, with the same name
          the map's tooltip carries. */}
      <div className="db-panel db-map-sections">
        <h2 className="db-panel-title">{ui.sectionStatus}</h2>
        {view.sections.length === 0 ? (
          <p className="db-sectionmeta">{ui.noSections}</p>
        ) : (
          <ul className="db-sectionlist">
            {view.sections.map((s) => (
              <li key={s.id} id={`sec-${s.id}`}
                  className={`db-sectionrow${selected === s.id ? ' is-selected' : ''}${hovered === s.id ? ' is-hovered' : ''}`}>
                <span className="db-sectionbar" aria-hidden="true" style={{ background: s.colour }} />
                <button
                  type="button"
                  className="db-sectionbtn"
                  aria-pressed={selected === s.id}
                  onClick={() => selectSection(s.id)}
                  onMouseEnter={() => setHovered(s.id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(s.id)}
                  onBlur={() => setHovered(null)}
                >
                  <span className="db-sectionname">{s.name}</span>
                  <span className="db-sectionmeta">{s.meta}</span>
                </button>
                {/* The word, so the colour is never the only carrier. */}
                <span className="db-sectiontag" style={{ border: `1px solid ${s.colour}` }}>
                  {s.conditionLabel}
                </span>
              </li>
            ))}
          </ul>
        )}
        {enhanced ? <p className="db-map-hint">{ui.selectHint}</p> : null}
      </div>
    </div>
  );
}
