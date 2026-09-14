/**
 * Road alerts by SMS and WhatsApp (W4.13) — pure rules.
 *
 * A subscriber is a Bangladesh mobile number and a channel. Numbers are
 * stored in one canonical form, +8801XXXXXXXXX, whatever the reader typed
 * (01711…, 8801711…, +880 1711-…), so the same phone cannot subscribe twice
 * and a broadcast reaches each number once per channel.
 */
export const CHANNELS = Object.freeze(['sms', 'whatsapp']);

/** A Bangladesh mobile number in +8801XXXXXXXXX form, or '' if it is not one. */
export function normaliseBdMobile(input) {
  let digits = String(input || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('880')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return /^1[3-9]\d{8}$/.test(digits) ? `+880${digits}` : '';
}

/** Shown in the admin list: enough to recognise a number, not to copy it. */
export function maskPhone(phone) {
  const p = String(phone || '');
  return p.length > 7 ? `${p.slice(0, 7)}•••${p.slice(-3)}` : '•••';
}

/** SMS is billed per 160 GSM / 70 Unicode characters: Bangla and Chinese are Unicode. */
export function smsSegments(text) {
  const t = String(text || '');
  const unicode = /[^\x00-\x7F]/.test(t);
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  return t.length <= single ? 1 : Math.ceil(t.length / multi);
}

export function broadcastText(messages, locale) {
  const m = messages && typeof messages === 'object' ? messages : {};
  return String(m[locale] || m.en || '').trim();
}
