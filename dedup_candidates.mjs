import mysql from 'mysql2/promise';

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  let totalDeleted = 0;
  
  for (const uf of UFS) {
    // Find duplicate IDs for this UF (keep only MIN id per candidatoSequencial+ano+turno)
    const [dupes] = await conn.execute(`
      SELECT cr.id
      FROM candidate_results cr
      WHERE cr.uf = ?
      AND cr.id NOT IN (
        SELECT min_id FROM (
          SELECT MIN(id) as min_id
          FROM candidate_results
          WHERE uf = ?
          GROUP BY candidatoSequencial, ano, turno
        ) t
      )
    `, [uf, uf]);
    
    if (dupes.length === 0) {
      console.log(`${uf}: no duplicates`);
      continue;
    }
    
    // Delete in batches of 500
    const ids = dupes.map(r => r.id);
    let deleted = 0;
    for (let i = 0; i < ids.length; i += 500) {
      const batch = ids.slice(i, i + 500);
      const placeholders = batch.map(() => '?').join(',');
      const [result] = await conn.execute(`DELETE FROM candidate_results WHERE id IN (${placeholders})`, batch);
      deleted += result.affectedRows;
    }
    
    totalDeleted += deleted;
    console.log(`${uf}: deleted ${deleted} duplicates (had ${dupes.length})`);
  }
  
  // Also handle national records (uf might be null or 'BR')
  const [count] = await conn.execute('SELECT COUNT(*) as total FROM candidate_results');
  console.log(`\nTotal deleted: ${totalDeleted}`);
  console.log(`Remaining records: ${count[0].total}`);
  
  await conn.end();
}

main().catch(console.error);
