/**
 * A per-key sliding-window rate limiter for the public write paths.
 *
 * ---------------------------------------------------------------------------
 * WHY A Map IN MODULE SCOPE, AND WHAT WOULD CHANGE
 * ---------------------------------------------------------------------------
 * The site runs on cPanel/Passenger as a SINGLE Node process (see
 * docs/deployment/2026-09-04-deploy-runbook.md — one app, one `tmp/restart.txt`
 * touch to restart it). One process means one module instance, which means one
 * Map, which means the counts below are the whole picture. Nothing shared is
 * needed and nothing shared is affordable: there is no Redis on this host and
 * a database-backed counter would put a write on the exact path we are trying
 * to stop from writing.
 *
 * If that ever stops being true — Passenger configured with
 * `passenger_max_instances > 1`, a second app server, or a move to a platform
 * that forks workers — the limit silently becomes `limit x workers`, because
 * each worker keeps its own Map and a load balancer spreads one attacker
 * across all of them. It degrades, it does not break: the cap loosens, it
 * never wrongly rejects. The fix at that point is a shared store (Redis, or a
 * `rate_limit` table with a unique key on (bucket, key, window_start) written
 * with INSERT ... ON DUPLICATE KEY UPDATE) behind this same function
 * signature. Nothing outside this module would change.
 *
 * State is also lost on restart, which is correct for this data: a deploy or
 * an OOM restart forgiving somebody's last five submissions costs nothing,
 * and persisting it would mean writing to the disk we are protecting.
 *
 * ---------------------------------------------------------------------------
 * SLIDING, NOT FIXED
 * ---------------------------------------------------------------------------
 * A fixed window resets on a boundary, so 2x the limit gets through back to
 * back across it — 5 at 09:59 and 5 at 10:00. Timestamps are kept per hit and
 * aged out individually instead, which costs `limit` numbers per key.
 *
 * `now` is a parameter so the window arithmetic is testable without faking
 * the clock.
 */

/** `${bucket}:${key}` -> array of hit timestamps, oldest first. */
const hits = new Map();

/**
 * The most keys tracked at once. A distributed flood would otherwise turn the
 * defence into the attack: 500k unique source addresses is 500k Map entries on
 * a host with a hard memory limit, and an OOM is a worse outcome than an
 * unthrottled form. At the cap the whole Map is dropped — every budget resets
 * once, bounded memory is kept, and the limiter starts again immediately.
 * Deliberately fail-open: this protects a disk quota, not a login.
 */
const MAX_TRACKED_KEYS = 10_000;

/** Longest key we will store, so a 5 KB X-Forwarded-For cannot bloat the Map. */
const MAX_KEY_CHARS = 64;

/**
 * When the last full sweep ran. A sweep is O(number of keys), so it runs at
 * most once per window rather than on every request — on a quiet site that is
 * a few hundred entries walked every ten minutes, and on a busy one the cost
 * is amortised across thousands of requests. Without it a key whose sender
 * never returns would sit in the Map until the process restarted.
 */
let lastSweep = 0;

function sweep(now, windowMs) {
  for (const [id, stamps] of hits) {
    if (!stamps.length || now - stamps[stamps.length - 1] >= windowMs) hits.delete(id);
  }
  lastSweep = now;
}

/**
 * Record a hit and say whether it is allowed.
 *
 * @param {string} bucket   which path is being limited ('contact', 'newsletter')
 * @param {string} key      the caller's identity, normally an IP
 * @param {{limit:number, windowMs:number, now?:number}} options
 * @returns {{ok:boolean, remaining:number, retryAfterMs:number}}
 */
export function rateLimit(bucket, key, { limit, windowMs, now = Date.now() }) {
  const id = `${bucket}:${String(key).slice(0, MAX_KEY_CHARS)}`;

  // Periodic sweep: drops keys nobody has touched for a whole window.
  if (now - lastSweep >= windowMs) sweep(now, windowMs);

  // Hard cap. Sweep first, so an expired-but-present key is not what pushes us
  // over it; clear only if genuinely live keys fill the Map.
  if (hits.size >= MAX_TRACKED_KEYS) {
    sweep(now, windowMs);
    if (hits.size >= MAX_TRACKED_KEYS) hits.clear();
  }

  const recent = (hits.get(id) || []).filter((ts) => now - ts < windowMs);

  if (recent.length >= limit) {
    hits.set(id, recent);
    // Measured from the OLDEST hit still in the window: that is the one whose
    // expiry frees a slot.
    return { ok: false, remaining: 0, retryAfterMs: windowMs - (now - recent[0]) };
  }

  recent.push(now);
  hits.set(id, recent);
  return { ok: true, remaining: limit - recent.length, retryAfterMs: 0 };
}

/**
 * The caller's address, for use as a rate-limit key.
 *
 * LEFT-MOST entry of X-Forwarded-For. Everything to the right of it is a proxy
 * in the chain; on this host Apache/Passenger prepends the real client and the
 * app never sees a socket address of its own worth using.
 *
 * A client can forge X-Forwarded-For, which is exactly why this is not an
 * authentication input. Forging it varies the KEY, which spreads an attacker
 * across buckets — the reason MAX_TRACKED_KEYS above exists. It bounds casual
 * abuse and accidental loops, which is what it is for.
 *
 * With no address at all, every anonymous request shares ONE bucket rather
 * than each getting an unlimited one. That fails closed.
 */
export function clientIp(headerList) {
  const read = (name) => {
    try {
      return String(headerList?.get?.(name) || '').trim();
    } catch {
      return '';
    }
  };

  const forwarded = read('x-forwarded-for')
    .split(',')
    .map((part) => part.trim())
    .find(Boolean);
  if (forwarded) return forwarded.slice(0, MAX_KEY_CHARS);

  const real = read('x-real-ip');
  if (real) return real.slice(0, MAX_KEY_CHARS);

  return 'unknown';
}

/** Test seam, and a reset for a long-lived process. */
export function resetRateLimits() {
  hits.clear();
  lastSweep = 0;
}

/** Test seam: how many keys are currently held. */
export function trackedKeyCount() {
  return hits.size;
}
