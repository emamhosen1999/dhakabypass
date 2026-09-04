import fs from 'node:fs/promises';
import path from 'node:path';
import { uploadRoot } from '../../../lib/media';

export const runtime = 'nodejs';

/**
 * Serves files written to MEDIA_ROOT (or its local dev fallback,
 * var/uploads/) — see lib/media.js. That directory is deliberately OUTSIDE
 * Next's `public/` folder so a git-pull deploy can never delete an upload;
 * being outside `public/` also means Next's static file server never sees
 * these files, so this route is what maps `/uploads/<name>` onto disk.
 *
 * Next always serves `public/` first, ahead of any route match. The legacy
 * uploader that used to write into public/uploads/ is gone — every admin
 * upload now goes through app/admin/api/upload/route.js -> saveUpload(), so
 * new files land in MEDIA_ROOT and are served here. Files written to
 * public/uploads/ BEFORE that change are still served as plain static
 * assets, completely unaffected by this route: this handler only ever runs
 * for a request that public/ didn't already answer.
 */

// Content-Type is decided ONLY from this allowlist, keyed on the file
// extension actually found on disk — never from a query string, header, or
// the `mime` value stored in the database.
const EXTENSION_TYPES = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function notFound() {
  return new Response('Not found', { status: 404 });
}

export async function GET(_request, { params }) {
  const { path: segments } = await params;
  if (!Array.isArray(segments) || segments.length === 0) return notFound();

  const root = path.resolve(uploadRoot());
  const requested = path.resolve(root, ...segments);

  // Traversal guard: the resolved path must still be inside root. This is
  // required even though every name saveUpload() writes is already
  // sanitised — this route serves whatever a URL asks for, not a name we
  // chose, so it cannot rely on write-time sanitisation alone.
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (requested !== root && !requested.startsWith(rootWithSep)) {
    return notFound();
  }

  const ext = path.extname(requested).toLowerCase();
  const contentType = EXTENSION_TYPES[ext];
  if (!contentType) return notFound();

  let data;
  try {
    data = await fs.readFile(requested);
  } catch {
    return notFound();
  }

  const headers = {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    // saveUpload() never overwrites a name (the `wx` flag plus a numeric
    // suffix on collision), so a given URL's bytes never change — safe to
    // cache aggressively as immutable, sparing a memory-limited shared host
    // a disk read on every image request.
    'Cache-Control': 'public, max-age=31536000, immutable',
  };
  // An SVG is XML a browser will happily execute as a document if opened
  // directly — forcing a download prevents that without needing a
  // sanitiser, which is why SVG can stay in the upload allowlist.
  if (ext === '.svg') {
    headers['Content-Disposition'] = 'attachment';
  }

  return new Response(data, { status: 200, headers });
}
