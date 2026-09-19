/**
 * The event layer (E6).
 *
 * The rule the handover states in prose is enforced here in code: no event
 * carries a phone number, an email address, a tracking number, a message, a
 * coordinate or a free-text query. Every event declares the properties it may
 * send and anything else is dropped, so a later caller cannot quietly widen
 * what leaves the browser by passing an extra field.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { track, EVENTS } from '../../lib/analytics/events.js';

const win = () => globalThis.window;

beforeEach(() => {
  globalThis.window = {};
});

afterEach(() => {
  delete globalThis.window;
  vi.restoreAllMocks();
});

describe('the event registry', () => {
  it('covers every event the plan names', () => {
    expect(Object.keys(EVENTS).sort()).toEqual([
      'alert_signup', 'camera_watch', 'contact_submitted', 'document_download',
      'emergency_tel_tap', 'kmpost_located', 'newsletter_signup', 'page_shared',
      'request_status_checked', 'request_submitted', 'toll_quote', 'toll_quote_unavailable',
    ]);
  });

  it('declares no property that could carry a person or a place', () => {
    const banned = ['phone', 'email', 'tracking_no', 'trackingNo', 'message', 'lat', 'lng', 'query', 'q', 'name'];
    for (const [event, props] of Object.entries(EVENTS)) {
      for (const prop of props) expect(banned, `${event}.${prop}`).not.toContain(prop);
    }
  });
});

describe('track', () => {
  it('sends a declared event to Plausible', () => {
    win().plausible = vi.fn();
    expect(track('toll_quote', { vehicle_class: 'truck', priced: 'yes' })).toBe(true);
    expect(win().plausible).toHaveBeenCalledWith('toll_quote', { props: { vehicle_class: 'truck', priced: 'yes' } });
  });

  it('sends it to Umami', () => {
    win().umami = { track: vi.fn() };
    track('newsletter_signup');
    expect(win().umami.track).toHaveBeenCalledWith('newsletter_signup', {});
  });

  it('sends it to GA4', () => {
    win().gtag = vi.fn();
    track('contact_submitted');
    expect(win().gtag).toHaveBeenCalledWith('event', 'contact_submitted', {});
  });

  it('drops a property the event did not declare', () => {
    win().plausible = vi.fn();
    track('request_submitted', { kind: 'grievance', tracking_no: 'GRV-4821', message: 'my car was hit' });
    expect(win().plausible).toHaveBeenCalledWith('request_submitted', { props: { kind: 'grievance' } });
  });

  it('refuses an event that is not in the registry', () => {
    win().plausible = vi.fn();
    expect(track('search_performed', { q: 'dhaka toll' })).toBe(false);
    expect(win().plausible).not.toHaveBeenCalled();
  });

  it('clamps a value rather than letting free text through a declared field', () => {
    win().plausible = vi.fn();
    track('camera_watch', { camera: 'x'.repeat(200) });
    const sent = win().plausible.mock.calls[0][1].props.camera;
    expect(sent.length).toBeLessThanOrEqual(60);
  });

  it('collapses whitespace and keeps a value a string', () => {
    win().plausible = vi.fn();
    track('document_download', { format: ' PDF\n', path: '/en/disclosures' });
    // `path` is not declared: every provider records the page with the event.
    expect(win().plausible.mock.calls[0][1].props).toEqual({ format: 'PDF' });
  });

  it('does nothing, and does not throw, when no provider is loaded', () => {
    expect(track('newsletter_signup')).toBe(false);
  });

  it('does nothing on the server, where there is no window at all', () => {
    delete globalThis.window;
    expect(() => track('newsletter_signup')).not.toThrow();
    expect(track('newsletter_signup')).toBe(false);
  });

  it('survives a provider that throws', () => {
    win().plausible = () => { throw new Error('blocked by an extension'); };
    expect(() => track('newsletter_signup')).not.toThrow();
  });

  it('drops a value that is neither a string nor a number nor a boolean', () => {
    win().plausible = vi.fn();
    track('camera_watch', { camera: { toString: () => 'sneaky' } });
    expect(win().plausible).toHaveBeenCalledWith('camera_watch', { props: {} });
  });
});
