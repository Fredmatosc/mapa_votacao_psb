// Script para deduplicar candidate_zone_results
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mysql = require('/home/ubuntu/mapa_votacao_psb/node_modules/.pnpm/mysql2@3.15.1/node_modules/mysql2/promise.js');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL não definida'); process.exit(1); }

const m = DATABASE_URL.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
const dbName = m[5].split('?')[0];

const conn = await mysql.createConnection({
  host: m[3], port: +m[4],
  user: m[1], password: decodeURIComponent(m[2]),
  database: dbName, ssl: { rejectUnauthorized: true },
});

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
let totalDeleted = 0;

for (const uf of UFS) {
  try {
    const [countRows] = await conn.query(`SELECT COUNT(*) as total FROM candidate_zone_results WHERE uf = ?`, [uf]);
    const total = countRows[0].total;
    if (total === 0) { console.log(`${uf}: 0 registros, pulando`); continue; }

    const [result] = await conn.query(`
      DELETE czr FROM candidate_zone_results czr
      INNER JOIN (
        SELECT MIN(id) as min_id, candidatoSequencial, numeroZona, uf, ano, turno
        FROM candidate_zone_results
        WHERE uf = ?
        GROUP BY candidatoSequencial, numeroZona, uf, ano, turno
        HAVING COUNT(*) > 1
      ) dups ON czr.candidatoSequencial = dups.candidatoSequencial
        AND czr.numeroZona = dups.numeroZona
        AND czr.uf = dups.uf
        AND czr.ano = dups.ano
        AND czr.turno = dups.turno
        AND czr.id != dups.min_id
        AND czr.uf = ?
    `, [uf, uf]);

    const deleted = result.affectedRows;
    totalDeleted += deleted;
    console.log(`${uf}: ${total} registros, ${deleted} duplicatas removidas`);
  } catch (err) {
    console.error(`${uf}: ERRO - ${err.message}`);
  }
}

console.log(`\nTotal removidos em candidate_zone_results: ${totalDeleted}`);
await conn.end();
