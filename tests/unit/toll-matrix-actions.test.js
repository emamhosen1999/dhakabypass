// tests/unit/toll-matrix-actions.test.js
//
// The /admin/corridor/toll-matrix server actions.
//
// Three things are pinned here, and each one has cost this codebase something
// before:
//
//   1. assertCan(...) runs FIRST, before a form value is read. An action that
//      validates and then authorises has already told an anonymous caller
//      which of their inputs was wrong.
//   2. validationError() RETURNS an Error. `validationError(...)` on its own
//      line is a no-op that lets a bad save through; every call site must
//      `throw` it (tests/unit/errors.test.js carries the mechanical guard).
//   3. friendly() is an allowlist — a raw driver error must never reach a
//      browser, and a save that failed must not revalidate as though it had.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../auth.js', () => ({ auth: vi.fn() }));
vi.mock('../../lib/corridor/interchanges.js', () => ({
  saveInterchange: vi.fn(), deleteInterchange: vi.fn(), listInterchanges: vi.fn(),
}));
vi.mock('../../lib/corridor/tolls.js', () => ({
  saveTollRate: vi.fn(), deleteTollRate: vi.fn(), listAllTollRates: vi.fn(),
}));
vi.mock('../../lib/corridor/advisories.js', () => ({
  saveAdvisory: vi.fn(), deleteAdvisory: vi.fn(), listAllAdvisories: vi.fn(),
}));
vi.mock('../../lib/corridor/toll-matrix.js', async (importOriginal) => ({
  ...(await importOriginal()),
  saveTollOdRate: vi.fn(),
  deleteTollOdRate: vi.fn(),
  listAllTollOdRates: vi.fn(),
}));
vi.mock('../../lib/settings.js', () => ({ setSetting: vi.fn(), isDataIllustrative: vi.fn() }));
vi.mock('../../lib/revalidate.js', () => ({ revalidateCorridor: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
// The production transport (redirect-with-notice) is tested on its own in
// run-action.test.js; here the bodies' thrown messages are the subject.
vi.mock('../../lib/admin/run-action.js', () => ({ runAction: (fn) => fn() }));

import { auth } from '../../auth.js';
import { listInterchanges } from '../../lib/corridor/interchanges.js';
import {
  saveTollOdRate, deleteTollOdRate, listAllTollOdRates,
} from '../../lib/corridor/toll-matrix.js';
import { revalidateCorridor } from '../../lib/revalidate.js';
import { revalidatePath } from 'next/cache';
import {
  listTollMatrixAction, saveTollOdRateAction, deleteTollOdRateAction,
} from '../../app/admin/(dash)/corridor/toll-matrix-actions.js';

const formData = (entries) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};

const VALID = {
  id: '', origin_interchange_id: '89', destination_interchange_id: '94',
  vehicle_class: 'car', distance_m: '21304', amount_bdt: '150',
  effective_from: '2025-08-23',
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { isAdmin: true, role: 'admin' } });
  listAllTollOdRates.mockResolvedValue([]);
  listInterchanges.mockResolvedValue([]);
});

describe('authorisation', () => {
  it('refuses an anonymous caller before touching the repository', async () => {
    auth.mockResolvedValue(null);
    await expect(saveTollOdRateAction(formData(VALID))).rejects.toThrow();
    expect(saveTollOdRate).not.toHaveBeenCalled();
  });

  it('refuses a translator — a toll is operational data, not copy', async () => {
    auth.mockResolvedValue({ user: { isAdmin: false, role: 'translator' } });
    await expect(saveTollOdRateAction(formData(VALID))).rejects.toThrow();
    await expect(deleteTollOdRateAction(formData({ id: '1' }))).rejects.toThrow();
    await expect(listTollMatrixAction()).rejects.toThrow();
    expect(saveTollOdRate).not.toHaveBeenCalled();
    expect(deleteTollOdRate).not.toHaveBeenCalled();
  });
});

describe('saveTollOdRateAction', () => {
  it('saves and invalidates the corridor tag plus its own screen', async () => {
    saveTollOdRate.mockResolvedValue(7);
    await saveTollOdRateAction(formData(VALID));
    expect(saveTollOdRate).toHaveBeenCalledWith(expect.objectContaining({
      origin_interchange_id: 89, destination_interchange_id: 94,
      vehicle_class: 'car', distance_m: 21304, amount_bdt: 150,
      effective_from: '2025-08-23',
    }));
    expect(revalidateCorridor).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/admin/corridor/toll-matrix');
  });

  it('rejects a direction that is not one of the two carriageways', async () => {
    await expect(
      saveTollOdRateAction(formData({ ...VALID, direction: 'eastbound' }))
    ).rejects.toThrow(/carriageway|direction/i);
    expect(saveTollOdRate).not.toHaveBeenCalled();
  });

  it('passes the S.R.O. citation through — the only route out of provisional', async () => {
    saveTollOdRate.mockResolvedValue(7);
    await saveTollOdRateAction(formData({
      ...VALID, sro_number: 'S.R.O. 214-Law/2025',
      sro_date: '23 August 2025', sro_link: 'https://example.gov.bd/214.pdf',
    }));
    expect(saveTollOdRate).toHaveBeenCalledWith(expect.objectContaining({
      sro_number: 'S.R.O. 214-Law/2025',
      sro_date: '23 August 2025',
      sro_link: 'https://example.gov.bd/214.pdf',
    }));
  });

  it('never accepts is_provisional from the form', async () => {
    saveTollOdRate.mockResolvedValue(7);
    await saveTollOdRateAction(formData({ ...VALID, is_provisional: '0' }));
    const [arg] = saveTollOdRate.mock.calls[0];
    expect(arg).not.toHaveProperty('is_provisional');
  });

  it('passes a VALIDATION error through unchanged and does NOT revalidate', async () => {
    const err = new Error('That fare no longer exists. It may have been deleted.');
    err.code = 'VALIDATION';
    saveTollOdRate.mockRejectedValue(err);
    await expect(saveTollOdRateAction(formData(VALID))).rejects.toThrow(
      'That fare no longer exists. It may have been deleted.'
    );
    expect(revalidateCorridor).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('replaces a raw driver error with a generic message', async () => {
    const err = new Error("Duplicate entry '89-94-car-2025-08-23' for key 'uq_toll_od'");
    err.code = 'ER_DUP_ENTRY';
    saveTollOdRate.mockRejectedValue(err);
    await expect(saveTollOdRateAction(formData(VALID))).rejects.toThrow(
      /already a fare|already exists/i
    );
    await expect(saveTollOdRateAction(formData(VALID))).rejects.not.toThrow(/Duplicate entry/);
  });

  it('hides a database misconfiguration message', async () => {
    saveTollOdRate.mockRejectedValue(
      new Error('withTransaction requires a configured database (DB_HOST/DB_NAME/DB_USER)')
    );
    await expect(saveTollOdRateAction(formData(VALID))).rejects.not.toThrow(/DB_HOST/);
  });
});

describe('deleteTollOdRateAction', () => {
  it('deletes and revalidates', async () => {
    await deleteTollOdRateAction(formData({ id: '12' }));
    expect(deleteTollOdRate).toHaveBeenCalledWith(12);
    expect(revalidateCorridor).toHaveBeenCalled();
  });

  it('does not leak a driver error', async () => {
    deleteTollOdRate.mockRejectedValue(new Error('ER_LOCK_WAIT_TIMEOUT: lock wait'));
    await expect(deleteTollOdRateAction(formData({ id: '12' }))).rejects.not.toThrow(/LOCK_WAIT/);
  });
});

describe('listTollMatrixAction', () => {
  it('returns the fares and the tolling points the operator may pick between', async () => {
    listAllTollOdRates.mockResolvedValue([{ id: 1 }]);
    listInterchanges.mockResolvedValue([
      { id: 89, chainage_m: 3218, kind: 'toll_plaza', names: { en: 'Vogra' } },
      { id: 81, chainage_m: 0, kind: 'interchange', names: { en: 'Naojor' } },
    ]);
    const out = await listTollMatrixAction();
    expect(out.fares).toEqual([{ id: 1 }]);
    expect(out.points.map((p) => p.id)).toEqual([89]);
  });
});
