import { describe, it, expect } from 'vitest';
import { pageTag, LIST_TAG } from '../../lib/revalidate.js';

describe('cache tags', () => {
  it('namespaces page tags by slug', () => {
    expect(pageTag('travel/toll')).toBe('page:travel/toll');
    expect(pageTag('home')).toBe('page:home');
  });

  it('has a stable list tag', () => {
    expect(LIST_TAG).toBe('pages:list');
  });

  it('never produces a tag for an empty slug', () => {
    expect(() => pageTag('')).toThrow(/slug/i);
  });
});
