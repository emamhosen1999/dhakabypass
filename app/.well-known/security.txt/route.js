import { getContactDetails } from '../../../lib/settings.js';

export const dynamic = 'force-dynamic';

/**
 * RFC 9116 security.txt (audit CON-SEC-02): where to report a vulnerability.
 * The contact comes from the site's own settings, so it stays a role address
 * an operator can change; the policy line points at the privacy notice until
 * DBEDC publishes a disclosure policy of its own.
 */
export async function GET() {
  let email = '';
  try { email = (await getContactDetails('en')).email || ''; } catch { email = ''; }
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 6);
  const lines = [
    `Contact: mailto:${email || 'info@dhakabypass.com'}`,
    'Contact: https://dhakabypass.com/en/contact',
    `Expires: ${expires.toISOString()}`,
    'Preferred-Languages: en, bn, zh',
    'Canonical: https://dhakabypass.com/.well-known/security.txt',
    'Policy: https://dhakabypass.com/en/privacy',
  ];
  return new Response(`${lines.join('\n')}\n`, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
