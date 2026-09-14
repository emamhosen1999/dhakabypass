'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setSpinning(false);
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
    <div className="db-pano">
      <div
        className="db-pano-view" role="img" aria-label={alt} tabIndex={0}
        style={{ backgroundImage: `url("${src}")`, backgroundPositionX: `${offset}px` }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}
      />
      <p className="db-pano-controls">
        <span>{labels.hint}</span>
        <button type="button" className="db-btn db-btn-secondary" onClick={() => setSpinning((s) => !s)}>{spinning ? labels.pause : labels.play}</button>
      </p>
    </div>
  );
}
