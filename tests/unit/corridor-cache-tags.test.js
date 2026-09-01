import { describe, it, expect } from 'vitest';
import { CORRIDOR_TAG, pageTag, LIST_TAG } from '../../lib/revalidate.js';

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
