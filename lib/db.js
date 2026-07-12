import mysql from 'mysql2/promise';

let pool;

/** True when DB env vars are present. Lets the site fall back to the JSON seed. */
export function dbEnabled() {
  return Boolean(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER);
}

export function getPool() {
  if (!dbEnabled()) return null;
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
      charset: 'utf8mb4_general_ci',
    });
  }
  return pool;
}

export async function query(sql, params = []) {
  const p = getPool();
  if (!p) return null;
  const [rows] = await p.execute(sql, params);
  return rows;
}
