import { describe, it, expect } from 'vitest';
import { normaliseTracking, contactMatches } from '../../lib/requests/status.js';

describe('request status lookup (W8C.7)', () => {
  it('accepts a tracking number however it was typed, and nothing else', () => {
    expect(normaliseTracking(' gr-260911-ab3d ')).toBe('GR-260911-AB3D');
    // Spaces are removed, but the hyphens are part of the format.
    expect(normaliseTracking('GR 260911 AB3D')).toBe('');
    expect(normaliseTracking('XX-260911-AB3D')).toBe('');
    expect(normaliseTracking("GR-260911-AB3D' OR 1=1")).toBe('');
  });

  it('opens a case only with the last four digits of its phone or its email', () => {
    const row = { phone: '+8801711000999', email: 'Someone@Example.com' };
    expect(contactMatches(row, '0999')).toBe(true);
    expect(contactMatches(row, 'someone@example.com')).toBe(true);
    expect(contactMatches(row, '1000')).toBe(false);
    expect(contactMatches(row, '')).toBe(false);
    expect(contactMatches({ phone: '', email: '' }, '0999')).toBe(false);
  });
});
