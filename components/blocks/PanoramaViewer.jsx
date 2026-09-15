'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

/**
 * A 360° (cylindrical) panorama: drag, swipe or use the arrow keys to look
 * around; the image wraps seamlessly. No library and no WebGL — a wide
 * photograph repeated as a background and moved — so it works on any phone
 * and costs nothing beyond the image. Auto-rotation pauses on interaction and
 * never runs for a reader who asked the system for reduced motion.
 */
export default function PanoramaViewer({ src, alt, labels, autoRotate = true }) {
  const [offset, setOffset] = useState(0);
  const [spinning, setSpinning] = useState(autoRotate);
  const drag = useRef(null);
  const frame = useRef(0);

  const hintId = useId();
  const [inView, setInView] = useState(false);
  const host = useRef(null);

  // No motion for readers who asked for none, and none on a phone by default
  // (UI audit UI-MEDIA-02): a turning image on a small screen is both a
  // battery cost and a distraction beside the text.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setSpinning(false);
    else if (window.matchMedia?.('(max-width: 767px)').matches) setSpinning(false);
  }, []);

  // The image is loaded only once the viewer is near the screen: a page with
  // several panoramas no longer downloads all of them on arrival.
  useEffect(() => {
    const el = host.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return undefined; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setInView(true); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!spinning) return undefined;
    let last = performance.now();
    const step = (now) => { setOffset((o) => o - (now - last) * 0.02); last = now; frame.current = requestAnimationFrame(step); };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [spinning]);

  const onDown = useCallback((e) => { setSpinning(false); drag.current = { x: e.clientX, o: offset }; e.currentTarget.setPointerCapture?.(e.pointerId); }, [offset]);
  const onMove = useCallback((e) => { if (drag.current) setOffset(drag.current.o + (e.clientX - drag.current.x)); }, []);
  const onUp = useCallback(() => { drag.current = null; }, []);
  const onKey = useCallback((e) => {
    if (e.key === 'ArrowLeft') { setSpinning(false); setOffset((o) => o + 60); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setSpinning(false); setOffset((o) => o - 60); e.preventDefault(); }
  }, []);

  return (
    <div className="db-pano" ref={host}>
      {/* An application region, not an image: it takes focus and answers to
          the arrow keys, and the hint is announced with it (UI-A11Y-03). */}
      <div
        className="db-pano-view" role="application" aria-label={alt} aria-describedby={hintId} tabIndex={0}
        aria-roledescription="panorama"
        style={{ backgroundImage: inView ? `url("${src}")` : 'none', backgroundPositionX: `${offset}px` }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}
      />
      <p className="db-pano-controls">
        <span id={hintId}>{labels.hint}</span>
        <button type="button" className="db-btn db-btn-secondary" aria-pressed={spinning} onClick={() => setSpinning((s) => !s)}>{spinning ? labels.pause : labels.play}</button>
      </p>
    </div>
  );
}
