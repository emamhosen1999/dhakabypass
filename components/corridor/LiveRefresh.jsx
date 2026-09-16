'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Keeps a page with live corridor data current without a reload.
 *
 * The cron measures the corridor every fifteen minutes and invalidates the
 * corridor cache; this asks the router to re-render the server components on
 * a timer while the tab is visible, so the map's colours, the status table
 * and the "measured at" times move on their own. Zoom, selection and scroll
 * survive, because the client components keep their state through a refresh.
 *
 * It also shows how old the newest measurement is — "Live · updated 4 min
 * ago" — ticking in the browser, from the server's measured_at. A page that
 * says nothing about its age reads as either always current or never, and
 * both are wrong. Renders nothing while the data is sample data: the sample
 * notice already says what that is.
 */
/**
 * The refresh timer alone. Mounted only in the browser, after hydration,
 * because useRouter needs the app router and a server render (or a test that
 * renders the block on its own) has none.
 */
function Refresher({ everyMs }) {
  const router = useRouter();
  useEffect(() => {
    let last = Date.now();
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      last = Date.now();
      router.refresh();
    };
    const timer = setInterval(refresh, everyMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - last > everyMs) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [router, everyMs]);
  return null;
}

export default function LiveRefresh({ measuredAt, everyMs = 120000, labels }) {
  const [now, setNow] = useState(() => Date.now());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const clock = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(clock);
  }, []);

  const at = measuredAt ? new Date(measuredAt).getTime() : NaN;
  if (!Number.isFinite(at) || !labels) return null;
  const minutes = Math.max(0, Math.round((now - at) / 60000));
  const age = minutes < 1 ? labels.justNow : labels.minutesAgo.replace('{n}', String(minutes));

  return (
    <p className="db-live" role="status" aria-live="polite">
      {mounted ? <Refresher everyMs={everyMs} /> : null}
      <span className="db-live-dot" aria-hidden="true" />
      <span className="db-live-tag">{labels.live}</span>
      <span className="db-live-age">{age}</span>
    </p>
  );
}
