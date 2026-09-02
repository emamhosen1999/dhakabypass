// tests/unit/corridor-actions.test.js
//
// Isolates the friendly()-sanitising layer of the corridor admin actions.
// lib/corridor/interchanges.js, tolls.js, advisories.js, lib/settings.js,
// auth.js, lib/revalidate.js and next/cache are mocked so the toll-rate
// action tests below exercise only friendly()'s allowlist logic in
// isolation. lib/corridor/segments.js is deliberately left UNMOCKED — the
// last describe block below calls the real saveSegment implementation to
// prove an actual library validationError() (not a hand-built stand-in)
// still reaches the caller through the action's try/catch + friendly().
// That call path never touches the database (the "to <= from" check in
// saveSegment throws before withTransaction runs), so no test DB is needed.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../auth.js', () => ({ auth: vi.fn() }));
vi.mock('../../lib/corridor/interchanges.js', () => ({
  saveInterchange: vi.fn(),
  deleteInterchange: vi.fn(),
  listInterchanges: vi.fn(),
}));
vi.mock('../../lib/corridor/tolls.js', () => ({
  saveTollRate: vi.fn(),
  deleteTollRate: vi.fn(),
  listAllTollRates: vi.fn(),
}));
vi.mock('../../lib/corridor/advisories.js', () => ({
  saveAdvisory: vi.fn(),
  deleteAdvisory: vi.fn(),
  listAllAdvisories: vi.fn(),
}));
vi.mock('../../lib/settings.js', () => ({
  setSetting: vi.fn(),
  isDataIllustrative: vi.fn(),
}));
vi.mock('../../lib/revalidate.js', () => ({ revalidateCorridor: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '../../auth.js';
import { saveTollRate } from '../../lib/corridor/tolls.js';
import { revalidateCorridor } from '../../lib/revalidate.js';
import { revalidatePath } from 'next/cache';
import {
  saveTollRateAction,
  saveSegmentAction,
} from '../../app/admin/(dash)/corridor/actions.js';

function formData(entries) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

const validToll = {
  vehicle_class: 'car',
  'class.en': 'Car',
  class_order: '1',
  section: 'Full',
  amount_bdt: '250',
  effective_from: '2026-01-01',
};

describe('friendly() — allowlist, not a denylist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { isAdmin: true, role: 'admin' } });
  });

  it('passes a VALIDATION-marked error through unchanged', async () => {
    const err = new Error('That toll rate no longer exists. It may have been deleted.');
    err.code = 'VALIDATION';
    saveTollRate.mockRejectedValue(err);

    await expect(saveTollRateAction(formData(validToll))).rejects.toThrow(
      'That toll rate no longer exists. It may have been deleted.'
    );
    expect(revalidateCorridor).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('replaces an unmarked, internal-looking error with the generic fallback', async () => {
    // Mirrors withTransaction's real misconfiguration message
    // (lib/db.js) — it carries no `.code`, so it must never reach the
    // browser even though its text isn't a raw SQL error.
    const err = new Error('withTransaction requires a configured database (DB_HOST/DB_NAME/DB_USER)');
    saveTollRate.mockRejectedValue(err);

    await expect(saveTollRateAction(formData(validToll))).rejects.toThrow(
      'Could not save the toll rate. Please try again.'
    );
    await expect(saveTollRateAction(formData(validToll))).rejects.not.toThrow(/DB_HOST|DB_NAME|DB_USER/);
  });

  it('replaces an unmarked internal TypeError (e.g. a null query result) with the generic fallback', async () => {
    const err = new TypeError("Cannot read properties of null (reading 'insertId')");
    saveTollRate.mockRejectedValue(err);

    await expect(saveTollRateAction(formData(validToll))).rejects.toThrow(
      'Could not save the toll rate. Please try again.'
    );
    await expect(saveTollRateAction(formData(validToll))).rejects.not.toThrow(/insertId|TypeError/);
  });

  it('maps a real driver ER_DUP_ENTRY error to a specific, actionable message, not the generic fallback', async () => {
    // toll_rates has UNIQUE KEY uq_class_effective (vehicle_class, effective_from).
    // The most likely way an operator hits this is following the admin's own
    // scheduling advice (add a new row, same class, future date) on a date that
    // already has one -- a permanent failure, so "please try again" would be
    // actively wrong: it tells the operator to retry something that can never
    // succeed as submitted.
    const dupErr = new Error("Duplicate entry 'car-2026-01-01' for key 'toll_rates.vehicle_class'");
    dupErr.code = 'ER_DUP_ENTRY';
    dupErr.sqlMessage = "Duplicate entry 'car-2026-01-01' for key 'toll_rates.vehicle_class'";
    saveTollRate.mockRejectedValue(dupErr);

    await expect(saveTollRateAction(formData(validToll))).rejects.toThrow(
      'A rate for that vehicle class already exists on that date.'
    );
    await expect(saveTollRateAction(formData(validToll))).rejects.not.toThrow(/Duplicate entry|ER_DUP_ENTRY/);
  });

  it('saves and revalidates when the write actually succeeds', async () => {
    saveTollRate.mockResolvedValue(7);
    await saveTollRateAction(formData(validToll));
    expect(revalidateCorridor).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/admin/corridor/tolls');
  });
});

describe('a real library validation message survives the action (regression pin)', () => {
  // lib/corridor/segments.js is NOT mocked in this file — saveSegmentAction
  // calls the actual saveSegment(), whose "to <= from" check throws its own
  // validationError()-marked Error before any database call. This proves the
  // allowlist inversion in friendly() didn't silently start flattening real
  // library validation messages into the generic fallback.
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { isAdmin: true, role: 'admin' } });
  });

  it('surfaces "A segment must end after it starts" unchanged, not the generic fallback', async () => {
    await expect(
      saveSegmentAction(formData({ from_m: 'K5+000', to_m: 'K3+000', status: 'planned' }))
    ).rejects.toThrow('A segment must end after it starts');
  });
});
