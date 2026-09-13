/**
 * Structured server log (W6.8).
 *
 * One JSON object per line on stderr, which Passenger writes to the app's
 * log on the host: `{"ts","level","event",...fields}`. A line can be grepped
 * by event name and parsed by any log tool, where the old free-text
 * `console.error('contact: failed…', code)` could only be read by eye.
 *
 * Never logs a message body, an email address, a phone number or a password:
 * callers pass codes and identifiers. `errorFields` keeps an error's name,
 * code, digest and the top of its stack — enough to find the line — and
 * drops the rest, which for a driver error can include the SQL it ran.
 */
const LEVELS = new Set(['info', 'warn', 'error']);

export function errorFields(err) {
  if (!err || typeof err !== 'object') return err === undefined ? {} : { error: String(err) };
  const out = { error: String(err.name || 'Error') };
  if (err.code) out.code = String(err.code);
  if (err.digest) out.digest = String(err.digest);
  if (typeof err.message === 'string' && !err.sql) out.message = err.message.slice(0, 300);
  // Frames only: the first stack line repeats the message, which for a driver
  // error can carry the value that failed.
  if (typeof err.stack === 'string') out.stack = err.stack.split('\n').slice(1, 4).map((l) => l.trim()).join(' | ');
  return out;
}

export function log(level, event, fields = {}) {
  const lvl = LEVELS.has(level) ? level : 'info';
  const line = { ts: new Date().toISOString(), level: lvl, event: String(event), ...fields };
  let text;
  try {
    text = JSON.stringify(line);
  } catch {
    text = JSON.stringify({ ts: line.ts, level: lvl, event: line.event, note: 'unserialisable fields' });
  }
  if (lvl === 'info') process.stdout.write(`${text}\n`);
  else process.stderr.write(`${text}\n`);
}

export const logError = (event, err, fields = {}) => log('error', event, { ...fields, ...errorFields(err) });
