import { describe, it, expect } from 'vitest';
import { CORRIDOR_TAG, ADVISORY_TAG, pageTag, LIST_TAG } from '../../lib/revalidate.js';

describe('corridor cache tag', () => {
  it('has a stable, distinct tag', () => {
    expect(CORRIDOR_TAG).toBe('corridor');
    expect(CORRIDOR_TAG).not.toBe(LIST_TAG);
  });

  it('does not collide with a page tag', () => {
    expect(pageTag('corridor')).toBe('page:corridor');
    expect(pageTag('corridor')).not.toBe(CORRIDOR_TAG);
  });
});

describe('advisory cache tag', () => {
  it('is a distinct, non-empty tag', () => {
    expect(typeof ADVISORY_TAG).toBe('string');
    expect(ADVISORY_TAG.length).toBeGreaterThan(0);
    expect(ADVISORY_TAG).not.toBe(CORRIDOR_TAG);
    expect(ADVISORY_TAG).not.toBe(LIST_TAG);
  });

  it('does not collide with a page tag', () => {
    expect(pageTag('advisories')).not.toBe(ADVISORY_TAG);
  });
});
