import { describe, it, expect } from 'vitest';
import { formatChainage, parseChainage, formatKm, metresToKm } from '../../lib/corridor/chainage.js';

describe('formatChainage', () => {
  it('writes the engineers\' notation with a three-digit metre part', () => {
    expect(formatChainage(3900)).toBe('K3+900');
    expect(formatChainage(0)).toBe('K0+000');
    expect(formatChainage(48000)).toBe('K48+000');
    expect(formatChainage(9400)).toBe('K9+400');
  });

  it('pads the metre part', () => {
    expect(formatChainage(1005)).toBe('K1+005');
    expect(formatChainage(1050)).toBe('K1+050');
  });

  it('returns an empty string for a non-number', () => {
    expect(formatChainage(null)).toBe('');
    expect(formatChainage(undefined)).toBe('');
    expect(formatChainage('3900')).toBe('');
    expect(formatChainage(NaN)).toBe('');
  });

  it('never emits a negative chainage', () => {
    expect(formatChainage(-100)).toBe('');
  });

  it('rejects non-integer metres', () => {
    // Floats would produce malformed output (e.g., K0+1000) that doesn't round-trip.
    // The caller has a bug if fractional metres are passed — the database stores INT.
    expect(formatChainage(999.6)).toBe('');
    expect(formatChainage(3900.6)).toBe('');
    expect(formatChainage(1999.5)).toBe('');
  });
});

describe('parseChainage', () => {
  it('reads the notation back', () => {
    expect(parseChainage('K3+900')).toBe(3900);
    expect(parseChainage('K0+000')).toBe(0);
    expect(parseChainage('K48+000')).toBe(48000);
  });

  it('tolerates lowercase and surrounding space', () => {
    expect(parseChainage('  k3+900 ')).toBe(3900);
  });

  it('accepts a plain metre count', () => {
    expect(parseChainage('3900')).toBe(3900);
  });

  it('returns null for anything it cannot read', () => {
    expect(parseChainage('')).toBe(null);
    expect(parseChainage('K3')).toBe(null);
    expect(parseChainage('three km')).toBe(null);
    expect(parseChainage(null)).toBe(null);
    expect(parseChainage('K3+9000')).toBe(null);
  });

  it('round-trips with formatChainage', () => {
    for (const m of [0, 5, 999, 1000, 3900, 48000]) {
      const formatted = formatChainage(m);
      // The critical invariant: if formatChainage returns a non-empty string,
      // parseChainage must read it back to the exact original value.
      // This fails if formatChainage produces malformed output like K0+1000.
      if (formatted !== '') {
        expect(parseChainage(formatted)).toBe(m);
      }
    }
  });
});

describe('formatKm', () => {
  it('renders kilometres for display', () => {
    expect(formatKm(48000)).toBe('48.0');
    expect(formatKm(18000)).toBe('18.0');
    expect(formatKm(3900)).toBe('3.9');
    expect(formatKm(48000, 0)).toBe('48');
  });

  it('returns an empty string for a non-number', () => {
    expect(formatKm(null)).toBe('');
  });

  it('clamps digits to valid range', () => {
    // formatKm should not throw on out-of-range digits; it clamps to [0, 100].
    expect(formatKm(48000, -1)).toBe('48');
    expect(formatKm(48000, 101)).toBe('48.0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000');
  });
});

describe('metresToKm', () => {
  it('converts without formatting', () => {
    expect(metresToKm(48000)).toBe(48);
    expect(metresToKm(3900)).toBe(3.9);
    expect(metresToKm(null)).toBe(0);
  });
});
