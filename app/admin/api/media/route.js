import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { saveUpload, listMedia, ALLOWED_MIME_TYPES } from '../../../../lib/media';

const MAX_BYTES = 8 * 1024 * 1024;

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!can(session.user.role, 'manage_media')) {
    return NextResponse.json({ error: 'Your role cannot view media' }, { status: 403 });
  }
  return NextResponse.json({ media: await listMedia() });
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!can(session.user.role, 'manage_media')) {
    return NextResponse.json({ error: 'Your role cannot upload media' }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Choose a file to upload' }, { status: 400 });
  }

  // Check the declared size before reading any bytes. request.formData()
  // has already parsed this part, but Buffer.from(await file.arrayBuffer())
  // below makes a second full in-memory copy — rejecting an oversized file
  // here avoids paying for that copy at all.
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'That image is larger than 8 MB' }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `${file.type} is not an accepted image type` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Backstop: file.size is a declared value from the multipart part, not a
  // guarantee. Re-check the actual bytes we're about to persist.
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: 'That image is larger than 8 MB' }, { status: 400 });
  }

  try {
    const saved = await saveUpload({ buffer, filename: file.name, mime: file.type });
    return NextResponse.json(saved, { status: 201 });
  } catch {
    // saveUpload's own errors may name internal config (e.g. missing DB
    // env vars) — keep the response user-facing only, no internals.
    return NextResponse.json({ error: 'Could not save that upload. Try again.' }, { status: 500 });
  }
}
