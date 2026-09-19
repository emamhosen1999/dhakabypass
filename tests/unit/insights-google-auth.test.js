/**
 * The service-account credential.
 *
 * A network round trip cannot be asserted on here, so the test generates its
 * own key pair, signs with it, and verifies the exact bytes Google would
 * verify. Everything else is about refusing to half-work: a missing or
 * malformed key makes the screen say "not configured", never throw on render.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { serviceAccount, signedAssertion, accessToken, forgetTokens, SCOPES } from '../../lib/insights/google-auth.js';

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const KEY = {
  type: 'service_account',
  project_id: 'dhaka-bypass-expressway',
  client_email: 'reporting@dhaka-bypass-expressway.iam.gserviceaccount.com',
  private_key: privateKey,
};

const envWith = (obj) => ({ GOOGLE_SA_KEY_B64: Buffer.from(JSON.stringify(obj)).toString('base64') });

beforeEach(() => forgetTokens());
afterEach(() => vi.restoreAllMocks());

describe('serviceAccount', () => {
  it('reads the account out of the base64 variable', () => {
    expect(serviceAccount(envWith(KEY)).client_email).toBe(KEY.client_email);
  });

  it('is null, not an error, when nothing is configured', () => {
    expect(serviceAccount({})).toBeNull();
    expect(serviceAccount({ GOOGLE_SA_KEY_B64: '   ' })).toBeNull();
  });

  it('is null when the value is not valid base64 JSON', () => {
    expect(serviceAccount({ GOOGLE_SA_KEY_B64: 'not-base64-at-all!!' })).toBeNull();
  });

  it('refuses anything that is not a service account key', () => {
    expect(serviceAccount(envWith({ type: 'authorized_user', client_email: 'a@b.c', private_key: 'x' }))).toBeNull();
    expect(serviceAccount(envWith({ type: 'service_account', client_email: 'a@b.c' }))).toBeNull();
    expect(serviceAccount(envWith({ type: 'service_account', private_key: 'x' }))).toBeNull();
  });
});

describe('signedAssertion', () => {
  const decode = (part) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

  it('signs the exact bytes Google verifies', () => {
    const jwt = signedAssertion(KEY, SCOPES.analytics, 1_700_000_000);
    const [header, claims, signature] = jwt.split('.');
    const ok = crypto.createVerify('RSA-SHA256')
      .update(`${header}.${claims}`)
      .verify(publicKey, Buffer.from(signature, 'base64url'));
    expect(ok).toBe(true);
  });

  it('claims the account, the scope and the token endpoint', () => {
    const [, claims] = signedAssertion(KEY, SCOPES.searchConsole, 1_700_000_000).split('.');
    expect(decode(claims)).toEqual({
      iss: KEY.client_email,
      scope: SCOPES.searchConsole,
      aud: 'https://oauth2.googleapis.com/token',
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    });
  });

  it('never asks for longer than the hour Google allows', () => {
    const [, claims] = signedAssertion(KEY, SCOPES.analytics, 1_700_000_000).split('.');
    const { iat, exp } = decode(claims);
    expect(exp - iat).toBe(3600);
  });

  it('asks only for read access', () => {
    expect(SCOPES.analytics).toContain('.readonly');
    expect(SCOPES.searchConsole).toContain('.readonly');
  });
});

describe('accessToken', () => {
  const ok = (token = 'ya29.test', expires = 3600) => vi.fn(async () => ({
    ok: true, json: async () => ({ access_token: token, expires_in: expires }),
  }));

  it('exchanges the assertion and returns the token', async () => {
    const fetchImpl = ok();
    expect(await accessToken(SCOPES.analytics, { env: envWith(KEY), fetchImpl })).toBe('ya29.test');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    expect(init.body.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    expect(init.body.get('assertion').split('.')).toHaveLength(3);
  });

  it('holds a live token rather than minting one per call', async () => {
    const fetchImpl = ok();
    const env = envWith(KEY);
    await accessToken(SCOPES.analytics, { env, fetchImpl });
    await accessToken(SCOPES.analytics, { env, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('keeps one token per scope, never crossing them', async () => {
    const fetchImpl = ok();
    const env = envWith(KEY);
    await accessToken(SCOPES.analytics, { env, fetchImpl });
    await accessToken(SCOPES.searchConsole, { env, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('mints again when the held token is nearly expired', async () => {
    const env = envWith(KEY);
    await accessToken(SCOPES.analytics, { env, fetchImpl: ok('first', 30) });
    const second = ok('second');
    expect(await accessToken(SCOPES.analytics, { env, fetchImpl: second })).toBe('second');
  });

  it('returns null when no service account is configured', async () => {
    const fetchImpl = ok();
    expect(await accessToken(SCOPES.analytics, { env: {}, fetchImpl })).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports a refusal with its status instead of returning a broken token', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 401, text: async () => 'invalid_grant' }));
    await expect(accessToken(SCOPES.analytics, { env: envWith(KEY), fetchImpl }))
      .rejects.toThrow(/401/);
  });

  it('does not retry: ten server errors an hour block the property entirely', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 500, text: async () => 'oops' }));
    await expect(accessToken(SCOPES.analytics, { env: envWith(KEY), fetchImpl })).rejects.toThrow();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
