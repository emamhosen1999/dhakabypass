'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * One corridor camera: its latest still, refreshed on the camera's interval,
 * and — where the camera has a stream — a live player opened on request (a
 * stream is never started for someone who did not ask for it; it costs data).
 *
 * HLS plays natively in Safari and through hls.js, loaded only when a viewer
 * presses play, everywhere else. Offline is a state, not an error page: the
 * still shows the last good image with the time it was taken.
 */
export default function CameraTile({ camera, labels }) {
  const [tick, setTick] = useState(0);
  const [offline, setOffline] = useState(false);
  const [live, setLive] = useState(false);
  const [updated, setUpdated] = useState(null);
  const videoRef = useRef(null);

  // A stored picture (a sample camera) never changes; only a relayed still is refreshed.
  const isLocal = camera.snapshotSrc.startsWith('/') && !camera.snapshotSrc.startsWith('/api/');
  useEffect(() => {
    if (!camera.snapshotSrc || isLocal || live) return undefined;
    const every = Math.max(5, camera.refreshSeconds || 30) * 1000;
    const timer = setInterval(() => { if (!document.hidden) setTick((n) => n + 1); }, every);
    return () => clearInterval(timer);
  }, [camera.snapshotSrc, camera.refreshSeconds, live, isLocal]);

  useEffect(() => {
    if (!live || !camera.streamSrc || !videoRef.current) return undefined;
    const video = videoRef.current;
    let hls = null;
    let cancelled = false;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = camera.streamSrc;
      video.play().catch(() => {});
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) { setOffline(true); return; }
        hls = new Hls({ lowLatencyMode: true, liveDurationInfinity: true });
        hls.on(Hls.Events.ERROR, (_e, data) => { if (data.fatal) { setOffline(true); hls.destroy(); } });
        hls.loadSource(camera.streamSrc);
        hls.attachMedia(video);
        video.play().catch(() => {});
      });
    }
    return () => { cancelled = true; if (hls) hls.destroy(); video.removeAttribute('src'); video.load(); };
  }, [live, camera.streamSrc]);

  const src = camera.snapshotSrc ? (isLocal ? camera.snapshotSrc : `${camera.snapshotSrc}?t=${tick}`) : '';

  return (
    <figure className="db-camera">
      <div className="db-camera-media">
        {live ? (
          <video ref={videoRef} className="db-camera-video" muted playsInline controls aria-label={`${labels.live}: ${camera.name}`} />
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src} alt={`${camera.name} — ${labels.still}`} loading="lazy" decoding="async"
            onLoad={() => { setOffline(false); setUpdated(new Date()); }}
            onError={() => setOffline(true)}
          />
        ) : (
          <div className="db-camera-empty">{labels.offline}</div>
        )}
        <span className={`db-camera-badge ${camera.isSample ? 'is-sample' : offline ? 'is-offline' : 'is-live'}`}>
          {camera.isSample ? labels.sample : offline ? labels.offline : live ? labels.live : labels.online}
        </span>
      </div>
      <figcaption className="db-camera-caption">
        <strong>{camera.name}</strong>
        {camera.place ? <span>{camera.place}</span> : null}
        {updated && !live && !camera.isSample ? (
          <span className="db-camera-time">{labels.updated.replace('{time}', updated.toLocaleTimeString(labels.intl, { hour: '2-digit', minute: '2-digit', second: '2-digit' }))}</span>
        ) : null}
        {camera.streamSrc && !camera.isSample ? (
          <button type="button" className="db-btn db-btn-secondary" onClick={() => { setOffline(false); setLive((v) => !v); }}>
            {live ? labels.stop : labels.watch}
          </button>
        ) : null}
      </figcaption>
    </figure>
  );
}
