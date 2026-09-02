/**
 * Creates the operational (corridor) tables. Idempotent.
 *   node scripts/db-setup-v3.mjs [--database=name]
 *
 * Chainage is stored as INTEGER METRES everywhere. "K3+900" is a display
 * format produced by lib/corridor/chainage.js — never a stored value, so
 * ordering and range queries stay correct without parsing strings.
 */
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';

loadEnv();

const arg = process.argv.find((a) => a.startsWith('--database='));
const DB_NAME = arg ? arg.split('=')[1] : process.env.DB_NAME || 'dhakabypass';
const { DB_HOST = '127.0.0.1', DB_PORT = '3306', DB_USER = 'root', DB_PASSWORD = '' } = process.env;

const db = await mysql.createConnection({
  host: DB_HOST, port: Number(DB_PORT), user: DB_USER, password: DB_PASSWORD,
  database: DB_NAME, multipleStatements: true,
});

try {
  await db.query(`
    CREATE TABLE IF NOT EXISTS segments (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      from_m     INT NOT NULL,
      to_m       INT NOT NULL,
      status     ENUM('open','construction','planned') NOT NULL DEFAULT 'planned',
      opened_on  DATE NULL,
      labels     JSON NULL,
      sort_order INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_from (from_m),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS interchanges (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      chainage_m  INT NOT NULL,
      names       JSON NOT NULL,
      kind        ENUM('interchange','toll_plaza','service_area','u_loop','pedestrian_overpass','bridge') NOT NULL DEFAULT 'interchange',
      status      ENUM('open','construction','planned') NOT NULL DEFAULT 'planned',
      connects_to VARCHAR(191) NOT NULL DEFAULT '',
      facilities  JSON NULL,
      lat         DECIMAL(10,7) NULL,
      lng         DECIMAL(10,7) NULL,
      updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_chainage (chainage_m),
      INDEX idx_kind (kind)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS toll_rates (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      vehicle_class  VARCHAR(64) NOT NULL,
      class_labels   JSON NOT NULL,
      class_order    INT NOT NULL DEFAULT 0,
      section        VARCHAR(191) NOT NULL DEFAULT '',
      amount_bdt     DECIMAL(10,2) NOT NULL,
      effective_from DATE NOT NULL,
      payment_methods JSON NULL,
      updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      -- Ensures exactly one rate per vehicle_class per effective_from date.
      -- Task 6 relies on this to guarantee "one rate in force today" without duplicate rows.
      -- Per-section pricing (same class, same date, different section) requires schema change.
      UNIQUE KEY uq_class_effective (vehicle_class, effective_from),
      INDEX idx_effective (effective_from),
      INDEX idx_class (vehicle_class, effective_from)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS advisories (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      severity   ENUM('info','warning','closure') NOT NULL DEFAULT 'info',
      messages   JSON NOT NULL,
      starts_at  DATETIME NULL,
      ends_at    DATETIME NULL,
      is_active  TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_active (is_active, starts_at, ends_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key VARCHAR(64) NOT NULL PRIMARY KEY,
      value       JSON NOT NULL,
      updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log(`Corridor schema ready on ${DB_NAME}`);
} catch (err) {
  console.error('Schema creation failed:', err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
