'use client';

import { useEffect, useRef } from 'react';
import { track } from './events.js';

/**
 * Record an event the first time `when` becomes true (E6).
 *
 * Every form on this site renders its success state from
 * `state.status === 'ok'`, and a render can repeat — React re-renders on a
 * parent update, and StrictMode runs effects twice in development. Firing
 * from the render path would count one grievance three times, so the event
 * goes through an effect and a ref that only opens once.
 *
 * It must be called ABOVE the early return that shows the success state,
 * because a hook cannot be called conditionally.
 */
export function useTrackOnce(when, name, props) {
  const fired = useRef(false);
  // The properties are read through a ref so a caller can pass an object
  // literal - which is a new identity every render - without re-running this.
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    if (!when || fired.current) return;
    fired.current = true;
    track(name, latest.current);
  }, [when, name]);
}
