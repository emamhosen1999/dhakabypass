/**
 * Copies admin_users into users, giving every existing account the admin role.
 * Idempotent — re-running updates nothing that already exists.
 *   node scripts/migrate-users.mjs [--database=name]
 */
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';

loadEnv();
const arg = process.argv.find((a) => a.startsWith('--database='));
const DB_NAME = arg ? arg.split('=')[1] : process.env.DB_NAME || 'dhakabypass';

const db = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
});

const [legacy] = await db.query(
  "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME='admin_users'",
  [DB_NAME]
);

if (legacy.length === 0) {
  console.log('No admin_users table — nothing to migrate.');
} else {
  const [res] = await db.query(`
    INSERT INTO users (email, name, password_hash, role)
    SELECT email, name, password_hash, 'admin' FROM admin_users
    ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash)
  `);
  console.log(`Migrated ${res.affectedRows} admin_users row(s) into users.`);
}
await db.end();
