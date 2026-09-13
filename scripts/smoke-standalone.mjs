/**
 * Start the packaged standalone server and prove it answers (W6.11).
 *
 * The release trims packages out of the traced output
 * (next.config.mjs outputFileTracingExcludes). A trim that removed something
 * the server loads at runtime would only surface as a crash in production,
 * so CI starts the artifact exactly as Passenger does and requests a public
 * page, a localised travel page, the sitemap and the admin sign-in.
 *
 *   node scripts/smoke-standalone.mjs        (after npm run build)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadEnv } from './load-env.mjs';

loadEnv();

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = Number(process.env.SMOKE_PORT || 3999);
const server = path.join(ROOT, '.next', 'standalone', 'server.js');
if (!fs.existsSync(server)) { console.error('no .next/standalone/server.js — build first'); process.exit(1); }

const media = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-media-'));
const child = spawn(process.execPath, [server], {
  cwd: path.dirname(server),
  env: {
    ...process.env, PORT: String(PORT), HOSTNAME: '127.0.0.1', NODE_ENV: 'production',
    SITE_URL: process.env.SITE_URL?.startsWith('https://') ? process.env.SITE_URL : 'https://dhakabypass.com',
    MEDIA_ROOT: media, AUTH_TRUST_HOST: 'true', ADMIN_EMAILS: process.env.ADMIN_EMAILS || 'smoke@example.invalid', AUTH_SECRET: process.env.AUTH_SECRET || 'smoke-test-secret-smoke-test-secret',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
child.stdout.on('data', (d) => { output += d; });
child.stderr.on('data', (d) => { output += d; });

const stop = (code) => { child.kill(); fs.rmSync(media, { recursive: true, force: true }); process.exit(code); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const PATHS = ['/en', '/bn/travel/toll', '/sitemap.xml', '/admin/login'];
let up = false;
for (let i = 0; i < 60 && !up; i += 1) {
  try { up = (await fetch(`http://127.0.0.1:${PORT}/robots.txt`)).status < 500; } catch { await wait(1000); }
}
if (!up) { console.error(`server did not start:\n${output.slice(-3000)}`); stop(1); }
let failed = false;
for (const p of PATHS) {
  const res = await fetch(`http://127.0.0.1:${PORT}${p}`, { redirect: 'manual' });
  const ok = res.status === 200;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${res.status} ${p}`);
  if (!ok) failed = true;
}
if (/Cannot find module/i.test(output)) { console.error('a module is missing from the artifact:\n' + output.slice(-3000)); failed = true; }
stop(failed ? 1 : 0);
