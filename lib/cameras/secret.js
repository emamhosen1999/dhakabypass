import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * Camera credentials at rest (CCTV).
 *
 * A camera or NVR password is needed server-side to fetch a snapshot or a
 * stream, and must never reach a browser or sit in the database readable.
 * AES-256-GCM with a key derived from CAMERA_SECRET, or AUTH_SECRET when that
 * is not set. Stored as `v1:<iv>:<tag>:<ciphertext>` in base64url. A value that
 * cannot be decrypted (a rotated secret) reads as '' — the camera then shows
 * offline and the admin screen asks for the password again.
 */
const PREFIX = 'v1';

function key(env = process.env) {
  const secret = env.CAMERA_SECRET || env.AUTH_SECRET || '';
  if (!secret) throw new Error('CAMERA_SECRET or AUTH_SECRET is required to store camera credentials.');
  return createHash('sha256').update(`dhakabypass-cameras:${secret}`).digest();
}

export function sealSecret(plain, env) {
  const text = String(plain ?? '');
  if (!text) return '';
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(env), iv);
  const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return [PREFIX, iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join(':');
}

export function openSecret(sealed, env) {
  const parts = String(sealed ?? '').split(':');
  if (parts.length !== 4 || parts[0] !== PREFIX) return '';
  try {
    const decipher = createDecipheriv('aes-256-gcm', key(env), Buffer.from(parts[1], 'base64url'));
    decipher.setAuthTag(Buffer.from(parts[2], 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(parts[3], 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}
