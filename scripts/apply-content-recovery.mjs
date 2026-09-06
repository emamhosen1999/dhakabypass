/** Apply the reviewed, conditional content migration without replacing CMS pages. */
import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';
import {loadEnv} from './load-env.mjs';
loadEnv();
const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),
  user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,multipleStatements:true});
try {
  await db.query(await fs.readFile(new URL('../db/sql/03-content-recovery.sql',import.meta.url),'utf8'));
  console.log('Reviewed content recovery applied; unmatched CMS edits preserved.');
} finally {await db.end();}
