import { describe, it, expect, vi, afterEach } from 'vitest';
import { log, logError, errorFields, orLog } from '../../lib/log.js';

afterEach(() => vi.restoreAllMocks());

describe('lib/log.js', () => {
  it('writes one JSON line per event, errors to stderr', () => {
    const err = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    logError('contact.record_failed', Object.assign(new Error('boom'), { code: 'ER_X' }), { kind: 'grievance' });
    const line = JSON.parse(err.mock.calls[0][0]);
    expect(line).toMatchObject({ level: 'error', event: 'contact.record_failed', code: 'ER_X', kind: 'grievance', message: 'boom' });
    expect(typeof line.ts).toBe('string');
  });

  it('never logs the SQL a driver error carries', () => {
    const f = errorFields(Object.assign(new Error('Duplicate entry a@b.c'), { code: 'ER_DUP_ENTRY', sql: 'INSERT … a@b.c' }));
    expect(JSON.stringify(f)).not.toMatch(/a@b\.c|INSERT/);
  });

  it('survives unserialisable fields', () => {
    const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const cyclic = {}; cyclic.self = cyclic;
    log('info', 'x', { cyclic });
    expect(JSON.parse(out.mock.calls[0][0]).note).toBe('unserialisable fields');
  });
});

describe('orLog - a fallback that is not silent', () => {
  it('returns the fallback so the caller can carry on', async () => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const rows = await Promise.reject(new Error('ER_NO_SUCH_TABLE')).catch(orLog('admin.pages_failed', []));
    expect(rows).toEqual([]);
  });

  it('records the reason the caller fell back', async () => {
    const err = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    await Promise.reject(Object.assign(new Error('gone'), { code: 'ER_NO_SUCH_TABLE' }))
      .catch(orLog('admin.pages_failed', [], { screen: 'dashboard' }));
    const line = JSON.parse(err.mock.calls[0][0]);
    expect(line).toMatchObject({ level: 'error', event: 'admin.pages_failed', code: 'ER_NO_SUCH_TABLE', screen: 'dashboard' });
  });
});
