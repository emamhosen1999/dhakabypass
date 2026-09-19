import crypto from 'node:crypto';

/**
 * An access token for a Google API, from the service account in the
 * environment.
 *
 * WHY THIS IS THIRTY LINES AND NOT A DEPENDENCY. `@google-analytics/data`
 * brings gRPC and google-gax with it — tens of megabytes of transitive
 * dependency and a native addon — onto a memory-limited shared host that runs
 * this app in a CloudLinux virtualenv. Both APIs used here are plain REST over
 * HTTPS, and the only hard part is signing a JWT, which node:crypto does.
 *
 * WHY BASE64. The key travels as base64 of the whole service-account JSON in
 * one variable. The `private_key` field is a PEM with literal `\n` escapes,
 * and every dotenv parser, cPanel form and shell quoting rule mangles it
 * differently; base64 has no characters any of them care about.
 *
 * NOTHING HERE IS EVER SENT TO THE BROWSER. These functions run on the server
 * only, and the admin screens render figures, never credentials.
 */

const PREFIX_VAR = 'GOOGLE_SA_KEY_B64';

/** Scopes, named so a caller cannot invent a wider one by typo. */
export const SCOPES = Object.freeze({
  // Read-only deliberately. A "Full" Search Console user can submit sitemaps
  // and disavow links; the scope is what makes this credential harmless.
  analytics: 'https://www.googleapis.com/auth/analytics.readonly',
  searchConsole: 'https://www.googleapis.com/auth/webmasters.readonly',
});

/**
 * The service account, or null when none is configured.
 * Never throws on a missing key: the admin screen says "not configured"
 * rather than failing to render.
 */
export function serviceAccount(env = process.env) {
  const raw = typeof env[PREFIX_VAR] === 'string' ? env[PREFIX_VAR].trim() : '';
  if (!raw) return null;
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    return null;
  }
  if (parsed?.type !== 'service_account') return null;
  if (!parsed.client_email || !parsed.private_key) return null;
  return parsed;
}

const b64url = (value) =>
  Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');

/**
 * The signed assertion Google exchanges for an access token.
 *
 * Exported for the test: a network round trip cannot be asserted on, but the
 * signature over the exact bytes can.
 */
export function signedAssertion(sa, scope, now = Math.floor(Date.now() / 1000)) {
  const claims = {
    iss: sa.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    // One hour is the maximum Google accepts; anything longer is rejected
    // outright rather than truncated.
    exp: now + 3600,
  };
  const unsigned = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url(claims)}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  return `${unsigned}.${signature}`;
}

/** Tokens last an hour; this keeps the live one rather than minting per call. */
const cache = new Map();

/**
 * A bearer token for one scope, or null when no service account is configured.
 *
 * One attempt, no retry loop. GA4 blocks every request to a property after ten
 * server errors in an hour, so a caller that retries on failure is the thing
 * that turns a blip into an outage.
 */
export async function accessToken(scope, { env = process.env, fetchImpl = fetch } = {}) {
  const sa = serviceAccount(env);
  if (!sa) return null;

  const now = Math.floor(Date.now() / 1000);
  const held = cache.get(scope);
  // A minute of headroom, so a token cannot expire between here and the call.
  if (held && held.expires > now + 60) return held.token;

  const res = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedAssertion(sa, scope, now),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    // The body can name the project and the key id; neither is a secret, but
    // it is trimmed so a log line stays a log line.
    throw new Error(`google token ${res.status}: ${detail.slice(0, 200)}`);
  }
  const body = await res.json();
  cache.set(scope, { token: body.access_token, expires: now + Number(body.expires_in || 3600) });
  return body.access_token;
}

/** For the tests, and for a deploy that swaps the key without a restart. */
export function forgetTokens() {
  cache.clear();
}
