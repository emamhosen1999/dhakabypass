/**
 * The events this site measures (E6).
 *
 * One `track()` for every provider. `components/chrome/Analytics.jsx` renders
 * whichever script `ANALYTICS_PROVIDER` names, so the provider is a server
 * decision and the client simply calls whatever turned up on `window`. With
 * `ANALYTICS_PROVIDER=none` — the default — nothing is on `window` and every
 * call is a no-op that costs one property read.
 *
 * WHAT MAY LEAVE THE BROWSER IS DECLARED HERE, NOT AT THE CALL SITE.
 *
 * Each event lists the properties it is allowed to send and anything else is
 * dropped. That is deliberate: a toll-road operator that ships a visitor's
 * grievance text, tracking number, phone number or GPS position to an
 * analytics processor has created a data-protection incident, not a
 * measurement. A later caller passing an extra field cannot widen this by
 * accident, and the test asserts the declarations themselves carry no such
 * field.
 *
 * Site search is deliberately absent. The query is already in the URL, so
 * Search Console and the access log hold it, and a free-text query is exactly
 * the thing that turns out to contain somebody's vehicle registration.
 */

/** Event name -> the properties it may carry. All low-cardinality. */
export const EVENTS = Object.freeze({
  // The calculator answered a journey. Not the plaza pair: origin and
  // destination together are close to a route history.
  toll_quote: ['vehicle_class', 'priced'],
  toll_quote_unavailable: ['vehicle_class'],
  // The kind of case, never the tracking number it was given.
  request_submitted: ['kind'],
  request_status_checked: ['found'],
  alert_signup: ['channel', 'action'],
  newsletter_signup: [],
  contact_submitted: [],
  // Not the page path: every provider records the page with the event, and
  // a second copy is a second thing to disagree.
  document_download: ['format'],
  camera_watch: ['camera'],
  // Whether the browser gave the position or the reader typed one. Never the
  // position itself.
  kmpost_located: ['source'],
  // The single most important number on the site, and nothing counted it.
  emergency_tel_tap: ['line'],
  page_shared: ['method'],
});

/** Long enough for a vehicle class or a camera name, too short for prose. */
const MAX_VALUE = 60;

const clean = (value) => {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, MAX_VALUE) : null;
};

/**
 * Record one event. Returns whether anything was sent, which the tests assert
 * on and callers may ignore.
 */
export function track(name, props = {}) {
  const declared = EVENTS[name];
  if (!declared || typeof window === 'undefined') return false;

  const payload = {};
  for (const key of declared) {
    const value = clean(props?.[key]);
    if (value !== null) payload[key] = value;
  }

  try {
    // Exactly one of these exists on any given deployment.
    if (typeof window.plausible === 'function') {
      window.plausible(name, { props: payload });
      return true;
    }
    if (typeof window.umami?.track === 'function') {
      window.umami.track(name, payload);
      return true;
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, payload);
      return true;
    }
  } catch {
    // An ad blocker replacing the provider with a throwing stub must not take
    // the form the reader was submitting down with it.
    return false;
  }
  return false;
}
