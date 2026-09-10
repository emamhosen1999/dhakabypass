import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { query, dbEnabled } from '../../../../lib/db';
import { saveUpload, ALLOWED_MIME_TYPES } from '../../../../lib/media';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * The one upload endpoint for the legacy admin screens (FieldInput,
 * GalleryManager, NewsForm). It replaces app/admin/actions.js's old
 * `uploadImageAction`, which derived the stored extension from the
 * client-supplied filename and wrote into public/ — see the note left in
 * that file.
 *
 * Everything about where the bytes land and what they are called is now
 * lib/media.js's business: saveUpload() maps a VALIDATED MIME type to the
 * extension and writes outside public/, so the file can only ever be served
 * by app/uploads/[...path]/route.js, which sets nosniff, a sandbox CSP and
 * Content-Disposition: attachment for SVG.
 *
 * The `{ ok, path, error }` response shape is kept exactly as the three
 * client callers already expect.
 */
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ ok: false, error: 'Not authorised' }, { status: 401 });
  }
  // BOTH checks, exactly as app/admin/api/media/route.js:11,20 does them.
  // `isAdmin` only means the address is on ADMIN_EMAILS; lib/auth/roles.js is
  // what separates an editor from a translator, whose permission set is
  // exactly ['translate']. Checking isAdmin alone let a translator persist an
  // 8 MB file and — with target=gallery below — insert a gallery_images row,
  // publishing it to the site. `can()` fails closed, so a missing or unknown
  // role is denied here rather than waved through.
  if (!can(session.user.role, 'manage_media')) {
    return NextResponse.json({ ok: false, error: 'Your role cannot upload media' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function' || !file.size) {
      return NextResponse.json({ ok: false, error: 'No file selected' }, { status: 400 });
    }

    // Check the declared size before reading any bytes — arrayBuffer() below
    // makes a second full in-memory copy of the part.
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: 'File is larger than 8MB' }, { status: 400 });
    }

    // The ONLY thing that decides the stored extension. The filename's own
    // extension is never consulted; saveUpload() uses it for the stem alone.
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: `${file.type || 'That file'} is not an accepted image type` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Backstop: file.size is a declared value from the multipart part, not a
    // guarantee. Re-check the bytes actually about to be persisted.
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: 'File is larger than 8MB' }, { status: 400 });
    }

    const saved = await saveUpload({ buffer, filename: file.name, mime: file.type });

    // If this upload targets the gallery, register it.
    if (formData.get('target') === 'gallery' && dbEnabled()) {
      const rows = await query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM gallery_images');
      await query('INSERT INTO gallery_images (file, caption, sort_order) VALUES (?, ?, ?)', [
        saved.path,
        String(formData.get('caption') || ''),
        rows?.[0]?.next ?? 0,
      ]);
    }

    // content is force-dynamic, but revalidate anyway so any cached shell refreshes
    revalidatePath('/', 'layout');

    return NextResponse.json({ ok: true, path: saved.path }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
