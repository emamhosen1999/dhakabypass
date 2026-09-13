/** Verify the shipped first-install SQL on an isolated test database. */
import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';
import { EXPECTED_TABLES } from '../lib/db/tables.js';
loadEnv();
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
if(!database || !/^[a-zA-Z][a-zA-Z0-9_]*_test$/.test(database)) {
  throw new Error('Pass an explicit --database name ending in _test.');
}
const connection=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),
  user:process.env.DB_USER,password:process.env.DB_PASSWORD||'',multipleStatements:true});
try {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${database}\``);
  for(let repeat=0;repeat<2;repeat++) {
    // Every numbered file, in order, as production receives them.
    const files=(await fs.readdir(new URL('../db/sql/',import.meta.url))).filter(f=>/^\d\d-.*\.sql$/.test(f)).sort();
    for(const file of files) await connection.query(await fs.readFile(new URL('../db/sql/'+file,import.meta.url),'utf8'));
  }
  const [rows]=await connection.query('SELECT COUNT(*) AS count FROM corridor_geometry');
  const [sources]=await connection.query('SELECT source FROM corridor_geometry_source WHERE id=1');
  const [tables]=await connection.query('SHOW TABLES');
  const names=tables.map(t=>Object.values(t)[0]).sort();
  const want=[...EXPECTED_TABLES].sort();
  if(JSON.stringify(names)!==JSON.stringify(want)) throw new Error(`The release SQL built tables [${names}] but lib/db/tables.js expects [${want}].`);
  if(rows[0].count<100 || sources[0]?.source!=='osm')throw new Error('The release SQL did not seed the expected road geometry.');
  console.log(`Release SQL imported twice: ${tables.length} tables, ${rows[0].count} road points, source ${sources[0].source}.`);
} finally { await connection.end(); }
