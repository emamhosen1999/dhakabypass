import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { saveUpload, listMedia } from '../../../../lib/media';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml'];

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
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: `${file.type} is not an accepted image type` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: 'That image is larger than 8 MB' }, { status: 400 });
  }

  const saved = await saveUpload({ buffer, filename: file.name, mime: file.type });
  return NextResponse.json(saved, { status: 201 });
}
