/**
 * Repair text that was stored double-encoded (UTF-8 bytes read as cp1252 and
 * encoded to UTF-8 again), which is what a SQL file imported through a client
 * whose connection charset is latin1 produces: "–" becomes "â€“", Bangla "অ"
 * becomes "à¦…".
 *
 * Found 14 September 2026 on production after migrations were imported with
 * the MariaDB client's default charset. Every numbered SQL file now begins with
 * SET NAMES utf8mb4, so a future import cannot do it again.
 *
 * A value is repaired only when it is WHOLLY double-encoded: every character
 * maps back to a single cp1252 byte and those bytes are valid UTF-8. A value
 * holding genuine text (a correct Bangla sentence, "Café") fails that test and
 * is left untouched and reported. Dry run by default; --apply writes.
 *
 *   node scripts/repair-mojibake.mjs            # report
 *   node scripts/repair-mojibake.mjs --apply    # repair
 */
import mysql from 'mysql2/promise';

const APPLY = process.argv.includes('--apply');

// cp1252 code points 0x80–0x9F that differ from latin1.
const CP1252 = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84], [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87],
  [0x02c6, 0x88], [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c], [0x017d, 0x8e], [0x2018, 0x91],
  [0x2019, 0x92], [0x201c, 0x93], [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97], [0x02dc, 0x98],
  [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b], [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
]);
const decoder = new TextDecoder('utf-8', { fatal: true });
const MARKER = /[À-ï][-¿ŒœŠšŸŽžƒˆ˜–—‘-„†-•…‰‹›€™]/;

/**
 * Whole-value repair first; failing that, repair each run of characters that
 * are all cp1252-representable high characters and decode as UTF-8 — a value
 * that had a double-encoded phrase spliced into correct text by a later edit.
 */
export function repairText(text) {
  const whole = undoDoubleEncoding(text);
  if (whole !== null) return whole;
  if (typeof text !== 'string' || !MARKER.test(text)) return null;
  const HIGH = /[-ÿŒœŠšŸŽžƒˆ˜–—‘-„†-•…‰‹›€™]{2,}/g;
  let changed = false;
  const out = text.replace(HIGH, (run) => {
    const fixed = undoDoubleEncoding(run);
    if (fixed === null) return run;
    changed = true;
    return fixed;
  });
  return changed ? out : null;
}

export function undoDoubleEncoding(text) {
  if (typeof text !== 'string' || !MARKER.test(text)) return null;
  const bytes = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp < 0x100) bytes.push(cp);
    else if (CP1252.has(cp)) bytes.push(CP1252.get(cp));
    else return null; // genuine non-Latin text: not double-encoded
  }
  try {
    const out = decoder.decode(Uint8Array.from(bytes));
    return out === text ? null : out;
  } catch {
    return null;
  }
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME, charset: 'utf8mb4_general_ci',
  });
  const [cols] = await conn.query(
    `SELECT c.TABLE_NAME AS t, c.COLUMN_NAME AS c, c.DATA_TYPE AS type
       FROM information_schema.COLUMNS c JOIN information_schema.TABLES tb ON tb.TABLE_NAME = c.TABLE_NAME AND tb.TABLE_SCHEMA = c.TABLE_SCHEMA
      WHERE c.TABLE_SCHEMA = DATABASE() AND tb.TABLE_TYPE = 'BASE TABLE'
        AND c.DATA_TYPE IN ('char','varchar','text','mediumtext','longtext','json','tinytext')
        AND c.EXTRA NOT LIKE '%GENERATED%'
        AND c.TABLE_NAME NOT IN ('schema_migrations','record_history','trash','audit_log','revisions','users')`,
  );
  const [keys] = await conn.query(
    `SELECT TABLE_NAME AS t, GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION) AS k
       FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'PRIMARY' GROUP BY TABLE_NAME`,
  );
  const pk = new Map(keys.map((r) => [r.t, r.k.split(',')]));
  let fixed = 0;
  let skipped = 0;
  for (const { t, c } of cols) {
    const key = pk.get(t);
    if (!key) continue;
    const [rows] = await conn.query(
      `SELECT ${key.map((k) => `\`${k}\``).join(', ')}, CAST(\`${c}\` AS CHAR) AS v FROM \`${t}\`
        WHERE \`${c}\` REGEXP '(Ã|Â|â€|à¦|à§|ä¸|å|æ|ç|è|é)'`,
    );
    for (const row of rows) {
      const repaired = repairText(row.v);
      const where = key.map((k) => `${k}=${row[k]}`).join(',');
      if (repaired === null) {
        if (MARKER.test(row.v)) { skipped += 1; console.log(`SKIP ${t}.${c} [${where}] not wholly double-encoded`); }
        continue;
      }
      if (/^\s*[[{]/.test(repaired)) {
        try { JSON.parse(repaired); } catch { skipped += 1; console.log(`SKIP ${t}.${c} [${where}] repaired JSON would not parse`); continue; }
      }
      fixed += 1;
      console.log(`${APPLY ? 'FIX ' : 'WOULD FIX'} ${t}.${c} [${where}] ${repaired.slice(0, 80).replace(/\s+/g, ' ')}`);
      if (APPLY) {
        await conn.query(
          `UPDATE \`${t}\` SET \`${c}\` = ? WHERE ${key.map((k) => `\`${k}\` = ?`).join(' AND ')}`,
          [repaired, ...key.map((k) => row[k])],
        );
      }
    }
  }
  console.log(`${APPLY ? 'repaired' : 'would repair'} ${fixed} values; left ${skipped} untouched`);
  await conn.end();
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('repair-mojibake.mjs')) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
