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
  const home = useMemo(() => {
    const [x, y, w, h] = String(view.viewBox).split(' ').map(Number);
    return { x, y, w, h };
  }, [view.viewBox]);

  const [box, setBox] = useState(home);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(initialSelected);
  const [enhanced, setEnhanced] = useState(false);
  const frameRef = useRef(null);
  const drag = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);

  // The controls appear only once this component is running, so a reader
  // without JavaScript is never shown a zoom button that does nothing.
  useEffect(() => { setEnhanced(true); }, []);

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
      const w = b.w / factor;
      const h = b.h / factor;
      // Hold the anchor point still: its fractional position in the box does
      // not change, so the map grows under the cursor rather than under the
      // corner.
      const fx = (cx - b.x) / b.w;
      const fy = (cy - b.y) / b.h;
      return clamp({ x: cx - fx * w, y: cy - fy * h, w, h });
    });
  }, [clamp]);

  /** Client coordinates -> SVG units, via the frame's own box. */
  const toSvg = useCallback((clientX, clientY) => {
    const el = frameRef.current;
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
    if (!enhanced) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) };
      drag.current = null;
      return;
    }
    const p = toSvg(e.clientX, e.clientY);
    if (!p) return;
    drag.current = { startX: e.clientX, startY: e.clientY, box, scale: p.scale, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current.dist > 0) {
        const mid = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
        if (mid) zoomAbout(dist / pinch.current.dist, mid.x, mid.y);
      }
      pinch.current = { dist };
      return;
    }

    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / d.scale;
    const dy = (e.clientY - d.startY) / d.scale;
    if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
    setBox(clamp({ ...d.box, x: d.box.x - dx, y: d.box.y - dy }));
  };

  const endPointer = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
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
    setSelected((cur) => {
      // A second click on the same section is "show me the whole road again",
      // which is the only other thing a reader wants at that moment.
      if (cur === id) { setBox(home); return null; }
      zoomToSection(id);
      return id;
    });
  }, [home, zoomToSection]);

  const zoomed = box.w < home.w - 0.5;
  const viewBox = `${box.x.toFixed(2)} ${box.y.toFixed(2)} ${box.w.toFixed(2)} ${box.h.toFixed(2)}`;

  return (
    <div className="db-map-explorer">
      <div
        className={`db-map-wrap${enhanced ? ' is-enhanced' : ''}${drag.current ? ' is-dragging' : ''}`}
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        style={{ aspectRatio: `${view.width} / ${view.height}` }}
      >
        <CorridorMap
          view={view}
          viewBox={enhanced ? viewBox : view.viewBox}
          hovered={hovered}
          selected={selected}
          onHoverSection={enhanced ? setHovered : undefined}
          onSelectSection={enhanced ? selectSection : undefined}
        />

        {enhanced ? (
          <div className="db-map-controls">
            <button type="button" onClick={() => zoomAbout(STEP, box.x + box.w / 2, box.y + box.h / 2)}
                    aria-label={ui.zoomIn}>+</button>
            <button type="button" onClick={() => zoomAbout(1 / STEP, box.x + box.w / 2, box.y + box.h / 2)}
                    aria-label={ui.zoomOut}>−</button>
            <button type="button" className="db-map-reset"
                    onClick={() => { setBox(home); setSelected(null); }}
                    disabled={!zoomed && !selected} aria-label={ui.resetView}>
              {ui.resetShort}
            </button>
          </div>
        ) : null}

        {/* The licence credit travels with the geometry, so it cannot be lost
            when the geometry is replaced. */}
        {ui.attribution ? <p className="db-map-credit">{ui.attribution}</p> : null}
      </div>

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
                <span className="db-sectiontag" style={{ color: s.colour, border: `1px solid ${s.colour}` }}>
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
