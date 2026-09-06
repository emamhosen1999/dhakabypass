/**
 * The one browser-side upload path for the admin.
 *
 * Lifted out of FieldInput.jsx (W1.1) so the pages-v2 block editor and the
 * legacy news/section forms post to the same endpoint with the same
 * response contract, instead of growing a second copy that drifts. The
 * endpoint itself — app/admin/api/upload/route.js — is what decides the
 * stored extension and where the bytes land; nothing here is trusted.
 *
 * Plain module, not 'use server' and not a component: it is imported by
 * client components only.
 */
export async function uploadImage(file, { target, caption } = {}) {
  const fd = new FormData();
  fd.append('file', file);
  if (target) fd.append('target', target);
  if (caption) fd.append('caption', caption);

  const res = await fetch('/admin/api/upload', { method: 'POST', body: fd });
  let json = {};
  try {
    json = await res.json();
  } catch {
    // A proxy or a Passenger restart can return HTML here. Fall through to
    // the generic message rather than throwing a JSON parse error at the
    // operator.
  }
  if (!res.ok || !json.ok) throw new Error(json.error || 'Upload failed');
  return json.path;
}

/**
 * The media library, for the picker. `/admin/api/media` requires the
 * `manage_media` permission, so a translator gets a 403 here — that is the
 * correct answer, and the caller surfaces it rather than failing silently.
 */
export async function listMediaLibrary() {
  const res = await fetch('/admin/api/media');
  let json = {};
  try {
    json = await res.json();
  } catch {
    // as above
  }
  if (!res.ok) throw new Error(json.error || 'Could not load the media library');
  return Array.isArray(json.media) ? json.media : [];
}
