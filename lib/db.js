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

/**
 * Runs `fn` inside a transaction on a single pooled connection.
 * `fn` receives a `q(sql, params)` bound to that connection — use it for every
 * statement in the unit of work, or the statement will run outside the
 * transaction on a different connection.
 */
export async function withTransaction(fn) {
  const pool = getPool();
  if (!pool) return null;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await conn.execute(sql, params);
      return rows;
    };
    const result = await fn(q);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
