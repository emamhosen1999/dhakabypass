import { describe, it, expect } from 'vitest';
import { isStaleDeployment } from '../../lib/admin/stale-deploy.js';

describe('isStaleDeployment', () => {
  it('recognises Next\'s missing-action error after a deploy, and nothing else', () => {
    expect(isStaleDeployment(new Error('Failed to find Server Action "40e4d0". This request might be from an older or newer deployment.'))).toBe(true);
    expect(isStaleDeployment(new Error('Server Action "abc" was not found on the server.'))).toBe(true);
    expect(isStaleDeployment(new Error('Cannot read properties of null'))).toBe(false);
    expect(isStaleDeployment(undefined)).toBe(false);
  });
});
