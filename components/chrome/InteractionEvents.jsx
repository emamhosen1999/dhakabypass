'use client';

import { useEffect } from 'react';
import { track } from '../../lib/analytics/events.js';

/**
 * One listener for the events that happen in server-rendered markup (E6).
 *
 * The emergency numbers sit in the footer of every page, and the document
 * lists are server components too. Making either of them a client component
 * to attach an onClick would ship their JavaScript to every reader on every
 * page, against a page-weight budget that CI enforces — to count a tap.
 *
 * So the markup declares what it is worth counting and this island does the
 * counting, once, and only when a provider is configured:
 *
 *   data-track="emergency_tel_tap" data-track-line="national"
 *     -> the event fires when the element, or anything inside it, is clicked.
 *
 *   data-track-view="request_status_checked" data-track-found="yes"
 *     -> the event fires once when the element appears, which for a server
 *        component is when its page renders.
 *
 * Any `data-track-*` attribute becomes a property, and lib/analytics/events.js
 * drops every property the event did not declare — so marking up an element
 * cannot widen what leaves the browser.
 */

const FIRED = 'trackFired';

const propsFrom = (el) => {
  const props = {};
  for (const [key, value] of Object.entries(el.dataset)) {
    if (key === 'track' || key === 'trackView' || key === FIRED) continue;
    if (!key.startsWith('track')) continue;
    const name = key.slice(5);
    if (!name) continue;
    // dataset gives `trackLine` for data-track-line; the registry knows it as
    // `line`, and a two-word attribute as `vehicle_class`.
    props[name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`).replace(/^_/, '')] = value;
  }
  return props;
};

export default function InteractionEvents() {
  useEffect(() => {
    const onClick = (event) => {
      const el = event.target?.closest?.('[data-track]');
      if (!el) return;
      track(el.dataset.track, propsFrom(el));
    };

    const fireViews = (root) => {
      const nodes = root?.querySelectorAll?.('[data-track-view]');
      for (const el of nodes || []) {
        if (el.dataset[FIRED]) continue;
        el.dataset[FIRED] = '1';
        track(el.dataset.trackView, propsFrom(el));
      }
    };

    document.addEventListener('click', onClick);
    fireViews(document);

    // A client-side navigation replaces the markup without a page load, so a
    // result rendered by the next page would otherwise never be counted.
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.('[data-track-view]')) fireViews(node.parentNode || document);
          else fireViews(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('click', onClick);
      observer.disconnect();
    };
  }, []);

  return null;
}
