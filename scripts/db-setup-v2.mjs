/**
 * Creates the structural tables for the reinnovation. Idempotent.
 *   node scripts/db-setup-v2.mjs [--database=name]
 * Leaves the legacy tables (content, news_updates, …) untouched — the live
 * site still reads them until cutover.
 */
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';

loadEnv();

const arg = process.argv.find((a) => a.startsWith('--database='));
const DB_NAME = arg ? arg.split('=')[1] : process.env.DB_NAME || 'dhakabypass';
const { DB_HOST = '127.0.0.1', DB_PORT = '3306', DB_USER = 'root', DB_PASSWORD = '' } = process.env;

const base = { host: DB_HOST, port: Number(DB_PORT), user: DB_USER, password: DB_PASSWORD, multipleStatements: true };

const server = await mysql.createConnection(base);
await server.query(
  `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
);
await server.end();

const db = await mysql.createConnection({ ...base, database: DB_NAME });

await db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(191) NOT NULL UNIQUE,
    name          VARCHAR(191) NOT NULL DEFAULT '',
    password_hash VARCHAR(255) NULL,
    role          ENUM('admin','editor','translator') NOT NULL DEFAULT 'editor',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS pages (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    slug         VARCHAR(191) NOT NULL UNIQUE,
    parent_id    INT NULL,
    template     VARCHAR(64) NOT NULL DEFAULT 'default',
    nav_order    INT NOT NULL DEFAULT 0,
    status       ENUM('draft','published') NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_parent (parent_id),
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS page_translations (
    page_id         INT NOT NULL,
    locale          ENUM('en','bn','zh') NOT NULL,
    title           VARCHAR(255) NOT NULL DEFAULT '',
    seo_title       VARCHAR(255) NOT NULL DEFAULT '',
    seo_description VARCHAR(500) NOT NULL DEFAULT '',
    og_image        VARCHAR(255) NOT NULL DEFAULT '',
    status          ENUM('missing','draft','published') NOT NULL DEFAULT 'missing',
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (page_id, locale),
    CONSTRAINT fk_pt_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS blocks (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    page_id    INT NOT NULL,
    type       VARCHAR(64) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    settings   JSON NULL,
    status     ENUM('draft','published') NOT NULL DEFAULT 'published',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_page_sort (page_id, sort_order),
    CONSTRAINT fk_blocks_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS block_translations (
    block_id   INT NOT NULL,
    locale     ENUM('en','bn','zh') NOT NULL,
    data       JSON NOT NULL,
    status     ENUM('missing','draft','published') NOT NULL DEFAULT 'missing',
    updated_by INT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (block_id, locale),
    CONSTRAINT fk_bt_block FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS media (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    path        VARCHAR(255) NOT NULL UNIQUE,
    width       INT NOT NULL DEFAULT 0,
    height      INT NOT NULL DEFAULT 0,
    bytes       INT NOT NULL DEFAULT 0,
    mime        VARCHAR(100) NOT NULL DEFAULT '',
    focal_x     DECIMAL(4,3) NOT NULL DEFAULT 0.500,
    focal_y     DECIMAL(4,3) NOT NULL DEFAULT 0.500,
    alt         JSON NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS menus (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS menu_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    menu_id    INT NOT NULL,
    parent_id  INT NULL,
    href       VARCHAR(255) NOT NULL DEFAULT '',
    labels     JSON NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    INDEX idx_menu_sort (menu_id, sort_order),
    CONSTRAINT fk_mi_menu FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS revisions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(32) NOT NULL,
    entity_id   INT NOT NULL,
    snapshot    JSON NOT NULL,
    created_by  INT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS audit_log (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    actor      VARCHAR(191) NOT NULL DEFAULT '',
    action     VARCHAR(64) NOT NULL,
    target     VARCHAR(191) NOT NULL DEFAULT '',
    detail     JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS redirects (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    source      VARCHAR(255) NOT NULL UNIQUE,
    destination VARCHAR(255) NOT NULL,
    status_code SMALLINT NOT NULL DEFAULT 301,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`);

console.log(`Structural schema ready on ${DB_NAME}`);
await db.end();
