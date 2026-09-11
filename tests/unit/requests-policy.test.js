import { describe, it, expect } from 'vitest';
import {
  KINDS, KIND_VALUES, STATUSES, isKind, makeTrackingNo, TRACKING_RE, dueAt, fieldPlan, validateRequest,
} from '../../lib/requests/policy.js';

const AT = new Date('2026-09-11T10:00:00Z');

describe('makeTrackingNo', () => {
  it('is prefix-date-four characters from the unambiguous alphabet', () => {
    const n = makeTrackingNo('grievance', AT, () => 0);
    expect(n).toBe('GR-260911-AAAA');
    expect(n).toMatch(TRACKING_RE);
  });

  it('carries a distinct prefix per kind and SR for anything unknown', () => {
    const prefixes = KIND_VALUES.map((k) => makeTrackingNo(k, AT, () => 0).slice(0, 2));
    expect(new Set(prefixes).size).toBe(KIND_VALUES.length);
    expect(makeTrackingNo('nonsense', AT, () => 0)).toMatch(/^SR-/);
  });

  it('never emits 0, O, 1, I or L', () => {
    // The alphabet is the guarantee; sample it exhaustively through rand.
    for (let i = 0; i < 31; i += 1) {
      const tail = makeTrackingNo('general', AT, () => i).slice(-4);
      expect(tail).not.toMatch(/[01OIL]/);
    }
  });

  it('uses the real CSPRNG when no rand is given', () => {
    const a = makeTrackingNo('breakdown');
    expect(a).toMatch(TRACKING_RE);
    expect(a).toMatch(/^BA-/);
  });
});

describe('dueAt', () => {
  it('uses the block value when positive', () => {
    expect(dueAt('grievance', 3, AT)).toEqual(new Date('2026-09-14T10:00:00Z'));
  });

  it('falls back to the kind default for 0, blank, negative and garbage', () => {
    // The editor stores a blank number as 0, so 0 must mean "standard".
    for (const v of [0, '', null, undefined, -2, 'soon']) {
      expect(dueAt('grievance', v, AT), String(v)).toEqual(new Date('2026-10-11T10:00:00Z'));
    }
    expect(dueAt('breakdown', 0, AT)).toEqual(new Date('2026-09-12T10:00:00Z'));
  });

  it('every kind has a positive default', () => {
    for (const k of KIND_VALUES) expect(KINDS[k].slaDays).toBeGreaterThan(0);
  });
});

describe('fieldPlan', () => {
  it('asks phone and email by default and vehicle/location only on request', () => {
    expect(fieldPlan({})).toEqual({ phone: true, email: true, vehicle: false, location: false });
    expect(fieldPlan({ askPhone: 'no', askVehicle: 'yes', askLocation: 'yes' }))
      .toEqual({ phone: false, email: true, vehicle: true, location: true });
  });
});

describe('validateRequest', () => {
  const plan = fieldPlan({});
  const good = { name: 'A', phone: '01610285004', email: '', subject: '', message: 'Help' };

  it('accepts a phone-only or an email-only request when either is asked', () => {
    expect(validateRequest(good, plan, 8000).ok).toBe(true);
    expect(validateRequest({ ...good, phone: '', email: 'a@b.co' }, plan, 8000).ok).toBe(true);
  });

  it('refuses a request nobody could answer, naming both contact fields', () => {
    const r = validateRequest({ ...good, phone: '', email: '' }, plan, 8000);
    expect(r.ok).toBe(false);
    expect(r.fields).toEqual(['phone', 'email']);
  });

  it('flags a malformed phone or email rather than silently dropping it', () => {
    expect(validateRequest({ ...good, phone: 'call me' }, plan, 8000).fields).toEqual(['phone']);
    expect(validateRequest({ ...good, phone: '', email: 'not-an-email' }, plan, 8000).fields).toEqual(['email']);
  });

  it('requires name and message, and vehicle/location only when the block asks', () => {
    expect(validateRequest({ ...good, name: ' ', message: '' }, plan, 8000).fields).toEqual(['name', 'message']);
    const withVehicle = fieldPlan({ askVehicle: 'yes', askLocation: 'yes' });
    expect(validateRequest(good, withVehicle, 8000).fields).toEqual(['vehicle_no', 'location']);
  });

  it('blanks fields the block did not ask for, even if a browser sent them', () => {
    const r = validateRequest({ ...good, vehicle_no: 'DM-1234', location: 'K3' }, plan, 8000);
    expect(r.ok).toBe(true);
    expect(r.value.vehicle_no).toBe('');
    expect(r.value.location).toBe('');
  });

  it('reports an over-long message as tooLong before anything else', () => {
    const r = validateRequest({ ...good, name: '', message: 'x'.repeat(9) }, plan, 8);
    expect(r).toEqual({ ok: false, tooLong: true, fields: ['message'] });
  });

  it('exports the lifecycle the admin queue moves through', () => {
    expect(STATUSES).toEqual(['new', 'in_progress', 'resolved', 'closed']);
    expect(isKind('toll_dispute')).toBe(true);
    expect(isKind('constructor')).toBe(false);
  });
});
