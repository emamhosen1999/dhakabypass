// tests/unit/upload-route-guard.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../auth.js', () => ({ auth: vi.fn() }));
// The route calls revalidatePath() on success. Outside a Next request scope
// that throws, and none of these cases should reach it anyway — mocking it
// makes that a test failure rather than a confusing stack trace.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '../../auth.js';
import { POST } from '../../app/admin/api/upload/route.js';

/**
 * The upload API route, guarded the same way as its sibling
 * app/admin/api/media/route.js.
 *
 * This exists because C-D15 / C-S3 found the route gating on
 * `session.user.isAdmin` ALONE. `isAdmin` only means the address is on
 * ADMIN_EMAILS; lib/auth/roles.js is what separates an editor from a
 * translator, whose permission set is exactly ['translate']. A translator
 * could therefore POST an 8 MB file, have it persisted, and — with
 * `target=gallery` — have a gallery_images row inserted, publishing it to the
 * site. They cannot browse the media library, but they could add to it.
 *
 * It survived because tests/unit/admin-legacy-guards.test.js asserts the
 * permission strings of the server ACTIONS and the API routes were never in
 * that list. This file tests the route itself, calling POST directly, so a
 * regression in the handler — not just in the permission table — fails.
 */
function formPost(entries = []) {
  const form = new FormData();
  for (const [k, v] of entries) form.append(k, v);
  return new Request('http://localhost/admin/api/upload', { method: 'POST', body: form });
}

describe('POST /admin/api/upload — role gate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a signed-out request', async () => {
    auth.mockResolvedValue(null);
    const res = await POST(formPost());
    expect(res.status).toBe(401);
  });

  it('rejects a session whose email is not on ADMIN_EMAILS', async () => {
    auth.mockResolvedValue({ user: { isAdmin: false, role: 'admin' } });
    const res = await POST(formPost());
    expect(res.status).toBe(401);
  });

  it('rejects a translator, who has no manage_media permission', async () => {
    auth.mockResolvedValue({ user: { isAdmin: true, role: 'translator' } });
    const res = await POST(formPost([['file', new File(['x'], 'a.png', { type: 'image/png' })]]));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.ok).toBe(false);
    // The response must not leak the file path, and must not be a 200.
    expect(body.path).toBeUndefined();
  });

  it('rejects a user with no role at all — someone on ADMIN_EMAILS with no users row', async () => {
    auth.mockResolvedValue({ user: { isAdmin: true, role: undefined } });
    const res = await POST(formPost([['file', new File(['x'], 'a.png', { type: 'image/png' })]]));
    expect(res.status).toBe(403);
  });

  it('rejects a role named after an Object prototype key', async () => {
    for (const role of ['constructor', '__proto__', 'toString']) {
      auth.mockResolvedValue({ user: { isAdmin: true, role } });
      const res = await POST(formPost());
      expect(res.status, role).toBe(403);
    }
  });

  it('lets an editor past the gate — the next failure is the missing file, not the role', async () => {
    // Proves the guard is a gate and not a wall: 400 here means authorization
    // passed and validation took over.
    auth.mockResolvedValue({ user: { isAdmin: true, role: 'editor' } });
    const res = await POST(formPost());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('No file selected');
  });

  it('lets an admin past the gate too', async () => {
    auth.mockResolvedValue({ user: { isAdmin: true, role: 'admin' } });
    const res = await POST(formPost());
    expect(res.status).toBe(400);
  });
});
