// tests/unit/errors.test.js
//
// lib/errors.js is the single home for validationError() and friendly(),
// consolidated from six and two copies respectively. friendly() is the only
// thing standing between a driver error and a public browser session, so the
// allowlist direction is pinned here as well as at the action layer
// (tests/unit/corridor-actions.test.js exercises it through a real action).

import { describe, it, expect } from 'vitest';
import { validationError, friendly } from '../../lib/errors.js';

describe('validationError', () => {
  it('RETURNS an error rather than throwing it', () => {
    // Every call site writes `throw validationError(...)`. If this threw, the
    // `return err` contract would silently invert at every one of them.
    const err = validationError('Enter a chainage like K3+900');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Enter a chainage like K3+900');
  });

  it("marks the error with code 'VALIDATION', the only thing friendly() allowlists", () => {
    expect(validationError('x').code).toBe('VALIDATION');
  });

  it('keeps an empty message rather than substituting one', () => {
    expect(validationError('').message).toBe('');
    expect(validationError('').code).toBe('VALIDATION');
  });
});

describe('friendly — allowlist, not a denylist', () => {
  it('rethrows a VALIDATION-marked error unchanged, same object identity', () => {
    const err = validationError('That image no longer exists.');
    let caught;
    try {
      friendly(err, 'The image could not be replaced. Please try again.');
    } catch (e) {
      caught = e;
    }
    expect(caught).toBe(err);
    expect(caught.message).toBe('That image no longer exists.');
  });

  it('replaces an Error with NO code with the generic fallback', () => {
    // This is the denylist-leak case. A sanitiser written the other way round
    // ("rethrow unless it looks internal") forwards exactly this to a browser.
    const err = new Error('withTransaction requires a configured database (DB_HOST/DB_NAME/DB_USER)');
    expect(() => friendly(err, 'Could not save. Please try again.')).toThrow(
      'Could not save. Please try again.'
    );
    expect(() => friendly(err, 'Could not save. Please try again.')).not.toThrow(/DB_HOST|DB_NAME|DB_USER/);
  });

  it('replaces a raw driver error with the generic fallback', () => {
    const err = new Error("Duplicate entry 'car-2026-01-01' for key 'toll_rates.vehicle_class'");
    err.code = 'ER_DUP_ENTRY';
    expect(() => friendly(err, 'Could not save. Please try again.')).toThrow(
      'Could not save. Please try again.'
    );
    expect(() => friendly(err, 'Could not save. Please try again.')).not.toThrow(/Duplicate entry/);
  });

  it('replaces an internal TypeError with the generic fallback', () => {
    const err = new TypeError("Cannot read properties of null (reading 'insertId')");
    expect(() => friendly(err, 'Could not save. Please try again.')).toThrow(
      'Could not save. Please try again.'
    );
  });

  it('survives a non-Error, null or undefined throw value', () => {
    // `catch (err) { friendly(err, ...) }` catches whatever was thrown, which
    // need not be an Error at all. The optional chaining must hold.
    expect(() => friendly(undefined, 'Generic.')).toThrow('Generic.');
    expect(() => friendly(null, 'Generic.')).toThrow('Generic.');
    expect(() => friendly('a bare string', 'Generic.')).toThrow('Generic.');
    expect(() => friendly({ message: 'plain object' }, 'Generic.')).toThrow('Generic.');
  });

  it('does not treat a lookalike code as validation', () => {
    const err = new Error('sneaky');
    err.code = 'validation';
    expect(() => friendly(err, 'Generic.')).toThrow('Generic.');
    const err2 = new Error('sneaky');
    err2.code = 'VALIDATION_ERROR';
    expect(() => friendly(err2, 'Generic.')).toThrow('Generic.');
  });

  it('never returns — it always throws', () => {
    expect(() => friendly(new Error('x'), 'Generic.')).toThrow();
    expect(() => friendly(validationError('x'), 'Generic.')).toThrow();
  });
});
