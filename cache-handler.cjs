/**
 * The data cache, shared correctly across Node processes (W6.18).
 *
 * Next's default handler keeps two things per process: the cache entries
 * (this app runs with `isrFlushToDisk: false`, see next.config.mjs) and the
 * record of which tags were revalidated. Passenger may run more than one
 * process for the app. An operator's save calls revalidateTag() in whichever
 * process took the request; every other process kept serving the old page
 * until its 300-second recovery floor, and a reload could flip between the
 * new wording and the old.
 *
 * Here the ENTRIES stay in memory (bounded, least-recently-used out first) —
 * nothing is flushed to disk that a `git pull` could collide with — but a tag
 * revalidation is written to one small shared file, `.next/cache/tags.json`,
 * and every process reads it (only when its mtime changes) before answering
 * from memory. An entry older than a revalidation of any of its tags is a
 * miss, in every process, from the next request on.
 *
 * Degrades rather than throws: if the file cannot be read or written, the
 * handler behaves as Next's own did — per-process — and the time-based
 * `revalidate` floors still bound staleness.
 */
const fs = require('node:fs');
const path = require('node:path');

const MAX_ENTRIES = Number(process.env.CACHE_MAX_ENTRIES) || 2000;
const TAGS_FILE = process.env.CACHE_TAGS_FILE || path.join(process.cwd(), '.next', 'cache', 'tags.json');
const TAGS_HEADER = 'x-next-cache-tags';

const entries = new Map();
let revalidated = {};
let seenMtime = 0;

function loadTags() {
  try {
    const { mtimeMs } = fs.statSync(TAGS_FILE);
    if (mtimeMs !== seenMtime) {
      revalidated = JSON.parse(fs.readFileSync(TAGS_FILE, 'utf8')) || {};
      seenMtime = mtimeMs;
    }
  } catch {
    // No file yet, or unreadable: keep what this process knows.
  }
  return revalidated;
}

function writeTags(tags, at) {
  try {
    const current = { ...loadTags() };
    for (const tag of tags) current[tag] = at;
    // Keep the file small: a tag revalidated more than a day ago can no longer
    // affect an entry, because every entry here expires sooner than that.
    const cutoff = at - 24 * 60 * 60 * 1000;
    for (const [tag, when] of Object.entries(current)) if (when < cutoff) delete current[tag];
    fs.mkdirSync(path.dirname(TAGS_FILE), { recursive: true });
    const tmp = `${TAGS_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(current));
    fs.renameSync(tmp, TAGS_FILE);
    revalidated = current;
    seenMtime = fs.statSync(TAGS_FILE).mtimeMs;
  } catch {
    for (const tag of tags) revalidated[tag] = at;
  }
}

function tagsOf(entry, ctx) {
  const out = new Set();
  const value = entry && entry.value;
  if (value && Array.isArray(value.tags)) value.tags.forEach((t) => out.add(t));
  const header = value && value.headers && value.headers[TAGS_HEADER];
  if (typeof header === 'string') header.split(',').forEach((t) => t && out.add(t));
  if (entry && Array.isArray(entry.tags)) entry.tags.forEach((t) => out.add(t));
  if (ctx && Array.isArray(ctx.tags)) ctx.tags.forEach((t) => out.add(t));
  if (ctx && Array.isArray(ctx.softTags)) ctx.softTags.forEach((t) => out.add(t));
  return [...out];
}

class SharedTagCacheHandler {
  constructor() {}

  async get(key, ctx) {
    const entry = entries.get(key);
    if (!entry) return null;
    const known = loadTags();
    if (tagsOf(entry, ctx).some((tag) => known[tag] && known[tag] > entry.lastModified)) {
      entries.delete(key);
      return null;
    }
    // Refresh recency for the LRU bound.
    entries.delete(key);
    entries.set(key, entry);
    return { lastModified: entry.lastModified, value: entry.value };
  }

  async set(key, data, ctx) {
    if (data === null || data === undefined) {
      entries.delete(key);
      return;
    }
    entries.delete(key);
    entries.set(key, { value: data, lastModified: Date.now(), tags: (ctx && ctx.tags) || [] });
    while (entries.size > MAX_ENTRIES) entries.delete(entries.keys().next().value);
  }

  async revalidateTag(tags) {
    const list = [tags].flat().filter(Boolean);
    if (list.length === 0) return;
    const at = Date.now();
    writeTags(list, at);
    for (const [key, entry] of entries) {
      if (tagsOf(entry).some((tag) => list.includes(tag))) entries.delete(key);
    }
  }

  resetRequestCache() {}
}

module.exports = SharedTagCacheHandler;
module.exports._internal = { entries, loadTags, TAGS_FILE };
