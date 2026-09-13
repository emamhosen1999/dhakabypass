/**
 * Creates the schema. Safe to re-run (all CREATE TABLE IF NOT EXISTS).
 *   node scripts/db-setup.mjs
 * Reads DB_* from .env.local / environment.
 */
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';

loadEnv();

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'dhakabypass',
} = process.env;

const server = await mysql.createConnection({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  multipleStatements: true,
});

await server.query(
  `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
);
await server.end();

const db = await mysql.createConnection({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  multipleStatements: true,
});

await db.query(`
  CREATE TABLE IF NOT EXISTS contact_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(191) NOT NULL,
    email      VARCHAR(191) NOT NULL,
    subject    VARCHAR(255) NOT NULL DEFAULT '',
    message    TEXT NOT NULL,
    read_at    TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS news_updates (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    slug         VARCHAR(255) NOT NULL UNIQUE,
    category     VARCHAR(100) NOT NULL DEFAULT 'Operations',
    source       VARCHAR(191) NOT NULL DEFAULT '',
    url          VARCHAR(500) NOT NULL DEFAULT '',
    excerpt      TEXT NOT NULL,
    body         LONGTEXT NULL,
    image        VARCHAR(255) NOT NULL DEFAULT '',
    published_at DATE NOT NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_published (is_published, published_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(191) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`);

// The legacy site's `content`, `gallery_images` and `admin_users` tables are no
// longer created (W6.10): nothing reads them, and 32-drop-legacy-tables.sql
// removes them from databases that still have them.
console.log(`Schema ready on ${DB_NAME}: contact_messages, news_updates, newsletter_subscribers`);
await db.end();
