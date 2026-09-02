import { describe, it, expect } from 'vitest';
import { parseChainageField } from '../../lib/corridor/form.js';

describe('parseChainageField', () => {
  it("accepts the engineers' notation", () => {
    expect(parseChainageField('K3+900')).toBe(3900);
    expect(parseChainageField('k21+900')).toBe(21900);
  });

  it('accepts a plain metre count', () => {
    expect(parseChainageField('3900')).toBe(3900);
  });

  it('throws a message that tells the editor the format', () => {
    expect(() => parseChainageField('three km')).toThrow(/K3\+900/);
    expect(() => parseChainageField('')).toThrow(/K3\+900/);
    expect(() => parseChainageField(null)).toThrow(/K3\+900/);
  });

  it('rejects a malformed metre part rather than guessing', () => {
    expect(() => parseChainageField('K3+9000')).toThrow(/K3\+900/);
  });
});
