/**
 * Copies admin_users into users, giving every newly-created account the
 * admin role.
 *
 * This is a true no-op on conflict: it never overwrites an existing users
 * row. If an email already exists in `users` (e.g. because someone changed
 * their password or name through the new system), that row is left exactly
 * as-is — the legacy admin_users values are NOT re-applied. Safe to re-run
 * any number of times, including after the new system has diverged from
 * the frozen legacy table.
 *
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

try {
  const [legacy] = await db.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME='admin_users'",
    [DB_NAME]
  );

  if (legacy.length === 0) {
    console.log('No admin_users table — nothing to migrate.');
  } else {
    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM admin_users');
    const [[{ count_before }]] = await db.query('SELECT COUNT(*) AS count_before FROM users');

    // ON DUPLICATE KEY UPDATE users.email = users.email is a genuine no-op
    // (qualified because INSERT...SELECT...ON DUPLICATE KEY UPDATE would
    // otherwise treat a bare `email` as ambiguous between the two tables).
    // It never touches name/password_hash/role on a row that already
    // exists, so a re-run can never roll back a password or name set
    // through the new system. Only brand-new emails get inserted.
    await db.query(`
      INSERT INTO users (email, name, password_hash, role)
      SELECT email, name, password_hash, 'admin' FROM admin_users
      ON DUPLICATE KEY UPDATE users.email = users.email
    `);

    const [[{ count_after }]] = await db.query('SELECT COUNT(*) AS count_after FROM users');
    const inserted = count_after - count_before;
    const alreadyPresent = total - inserted;
    console.log(
      `Inserted ${inserted} new user(s) from admin_users (${alreadyPresent} already present in users and left untouched).`
    );
  }
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
