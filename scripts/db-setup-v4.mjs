/**
 * Adds provenance to the media table.
 *
 * origin='legacy' marks the images inherited from the old site. They are real
 * DBEDC photographs but they are low-resolution web derivatives, so every one
 * is a placeholder awaiting an original. The admin media screen sorts on this
 * column, and docs/admin/replacing-images.md explains it to the operator.
 *
 * Safe to re-run: each ALTER is guarded by an information_schema check.
 */
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';

loadEnv();

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});

async function addColumn(table, column, ddl) {
  const [rows] = await db.execute(
    `SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  if (rows.length) { console.log(`  ${table}.${column} already present`); return; }
  await db.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
  console.log(`  added ${table}.${column}`);
}

await addColumn('media', 'origin', "origin VARCHAR(16) NOT NULL DEFAULT 'upload'");
await addColumn('media', 'credit', "credit VARCHAR(160) NOT NULL DEFAULT ''");

console.log('media schema ready');
await db.end();
