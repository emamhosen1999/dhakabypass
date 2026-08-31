import { NextResponse } from 'next/server';
import { uploadImageAction } from '../../actions';
import { auth } from '../../../../auth';

export const runtime = 'nodejs';

/** Image upload endpoint used by the admin field editor. Admin-only. */
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ ok: false, error: 'Not authorised' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const result = await uploadImageAction(formData);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
