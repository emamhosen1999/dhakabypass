/**
 * Adds Bangla and Chinese alt text to the images used on the home page.
 *
 * media.alt was seeded with an `en` key only, so a Bangla screen-reader user
 * hears an English description of a Bangla page. This fills the gap for the
 * nine images the home page actually renders.
 *
 * ---------------------------------------------------------------------------
 * NON-DESTRUCTIVE BY DESIGN. Read this before "simplifying" the merge.
 *
 * This script only ADDS locale keys that are missing. It never overwrites a
 * key that is already present — not `en`, not a `bn` an operator has already
 * corrected in the admin, not anything.
 *
 * That is the same contract scripts/import-legacy-media.mjs keeps: `alt` is
 * deliberately excluded from its ON DUPLICATE KEY UPDATE list precisely so
 * that re-running an import cannot clobber alt text a human has edited. A
 * second script that clobbers on re-run would quietly undo that guarantee, and
 * the person who lost their edits would have no way to tell which run did it.
 *
 * The consequence to be aware of: correcting a translation here does NOT
 * update a row that already has that locale. Fix it in the admin, or clear
 * the key first. That is the intended trade — an operator's words outrank a
 * script's.
 * ---------------------------------------------------------------------------
 *
 * Safe to re-run: the second run writes nothing and says so.
 */
import { loadEnv } from './load-env.mjs';

loadEnv();
import mysql from 'mysql2/promise';

/**
 * The nine images the home page renders, from scripts/seed-home-v2.mjs: the
 * hero, the two image-and-text blocks, and the six-tile corridor grid.
 *
 * The English strings are NOT repeated here. They live in the media rows and
 * in docs/source-data/2026-09-03-image-library-audit.md, and duplicating them
 * into a third place would guarantee the three drift apart. The bn and zh
 * below translate the MEANING of what is in each frame, in the same plain
 * register as the rest of the site — a screen-reader user needs to know what
 * the picture shows, not to hear a caption read twice.
 */
const ALT = {
  '/bg-hero.webp': {
    bn: 'আকাশ থেকে তোলা এক্সপ্রেসওয়ে, জলাভূমি ও গ্রামের মাঝ দিয়ে বাঁক নিয়ে গেছে, খোলা ক্যারেজওয়েতে যান চলাচল করছে',
    zh: '从空中俯瞰快速路，在湿地与村庄之间蜿蜒，已通车的行车道上有车辆通行',
  },
  '/bypass-ex.webp': {
    // The gantry legend is quoted as it is painted, in Latin. A blind reader
    // being told what a sign says needs the string that is on the sign.
    bn: 'ক্যারেজওয়ের উপরে একটি গ্যান্ট্রিতে লেখা “Welcome to Dhaka Bypass Expressway”, তার ওপাশে টোল প্লাজা ও ট্রাক',
    zh: '行车道上方的龙门架写着“Welcome to Dhaka Bypass Expressway”，后方是收费广场和货车',
  },
  '/photo/16.webp': {
    bn: 'সদ্য শেষ হওয়া পিচঢালা পৃষ্ঠ, নতুন পৃষ্ঠের উপর দিয়ে কয়েকজন হেঁটে যাচ্ছেন',
    zh: '刚铺好的沥青路面，有人在新路面上行走',
  },
  '/photo/17.webp': {
    bn: 'কংক্রিটের রিটেইনিং ওয়ালের মাঝখানে একটি রোলার সদ্য বিছানো পিচ কম্প্যাক্ট করছে',
    zh: '压路机在混凝土挡土墙之间碾压新铺的沥青',
  },
  '/photo/18.webp': {
    bn: 'সন্ধ্যায় একটি পেভার পিচ বিছাচ্ছে, নিচু সূর্যের আলো এসে পড়েছে',
    zh: '摊铺机在黄昏时分摊铺沥青，低垂的夕阳照在机身上',
  },
  '/photo/20.webp': {
    bn: 'নির্মাণ শেষ হওয়া এক্সপ্রেসওয়ে বরাবর আকাশ থেকে তোলা দৃশ্য, দুই দিকের ক্যারেজওয়েতেই যান চলাচল করছে',
    zh: '沿建成的快速路航拍，双向行车道上均有车辆通行',
  },
  '/photo/21.webp': {
    bn: 'উন্মুক্ত জলের উপর নির্মাণাধীন একটি সেতুর আকাশ থেকে তোলা দৃশ্য',
    zh: '航拍在开阔水面上在建的桥梁',
  },
  '/photo/22.webp': {
    bn: 'নদী পার হওয়া নির্মাণ-সম্পন্ন ভায়াডাক্টের আকাশ থেকে তোলা দৃশ্য, তার উপরে যান চলাচল করছে',
    zh: '航拍已建成的跨河高架桥，桥上有车辆通行',
  },
  '/photo/23.webp': {
    bn: 'ভায়াডাক্টের ডেক বরাবর দিগন্তের দিকে আকাশ থেকে তোলা দৃশ্য',
    zh: '航拍沿高架桥桥面望向天际线',
  },
};

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});

/**
 * Same defensive parse as lib/media/repo.js: a hand-edited row can hold a
 * string, an array, or invalid JSON where an object belongs. Treat anything
 * that is not a plain object as "no alt yet" rather than throwing — but say
 * so out loud, because it means somebody's edit is not being read.
 */
function parseAlt(value, path) {
  let alt = value;
  try {
    if (typeof alt === 'string') alt = JSON.parse(alt);
  } catch {
    console.warn(`  ! ${path}: alt is not valid JSON, treating as empty`);
    return {};
  }
  if (!alt || typeof alt !== 'object' || Array.isArray(alt)) {
    if (alt !== null && alt !== undefined) {
      console.warn(`  ! ${path}: alt is not an object, treating as empty`);
    }
    return {};
  }
  return alt;
}

let updated = 0;
let unchanged = 0;
let missing = 0;
let added = 0;
let kept = 0;

for (const [path, translations] of Object.entries(ALT)) {
  const [rows] = await db.execute('SELECT id, alt FROM media WHERE path = ? LIMIT 1', [path]);
  if (!rows.length) {
    console.warn(`  ! not registered in media, skipped: ${path}`);
    missing += 1;
    continue;
  }
  const current = parseAlt(rows[0].alt, path);
  const next = { ...current };
  const addedHere = [];
  const keptHere = [];

  for (const [locale, text] of Object.entries(translations)) {
    // The whole point of the script. A key that is already there — whatever it
    // says, whoever wrote it — is left exactly as it is.
    if (Object.prototype.hasOwnProperty.call(current, locale)) {
      keptHere.push(locale);
      continue;
    }
    next[locale] = text;
    addedHere.push(locale);
  }

  added += addedHere.length;
  kept += keptHere.length;

  if (addedHere.length === 0) {
    unchanged += 1;
    console.log(`  = ${path}  no change (already has ${keptHere.join(', ') || 'nothing to add'})`);
    continue;
  }

  await db.execute('UPDATE media SET alt = ? WHERE id = ?', [JSON.stringify(next), rows[0].id]);
  updated += 1;
  const keptNote = keptHere.length ? `, left ${keptHere.join(', ')} alone` : '';
  console.log(`  + ${path}  added ${addedHere.join(', ')}${keptNote}`);
}

console.log('');
console.log(`${updated} rows updated, ${unchanged} already complete, ${missing} not registered`);
console.log(`${added} locale keys added, ${kept} existing keys left untouched (en is never rewritten)`);
if (updated === 0) console.log('Nothing to do — this run was a no-op.');
await db.end();
