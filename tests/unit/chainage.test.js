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
      expect(parseChainage(formatChainage(m))).toBe(m);
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
});

describe('metresToKm', () => {
  it('converts without formatting', () => {
    expect(metresToKm(48000)).toBe(48);
    expect(metresToKm(3900)).toBe(3.9);
    expect(metresToKm(null)).toBe(0);
  });
});
