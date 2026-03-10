/**
 * Script: import-cpf.mjs
 * Lê os CSVs de candidatos do TSE (2020 e 2022) e popula o campo CPF
 * na tabela candidate_results usando o sequencial como chave de ligação.
 *
 * Uso: node scripts/import-cpf.mjs
 */

import mysql from "mysql2/promise";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { readdirSync } from "fs";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL não definida");
  process.exit(1);
}

// Campos do CSV de candidatos do TSE (posição 0-indexed)
// [0]=DT_GERACAO [1]=HH_GERACAO [2]=ANO_ELEICAO ... [13]=CD_CARGO [14]=DS_CARGO
// [15]=SQ_CANDIDATO [16]=NR_CANDIDATO [17]=NM_CANDIDATO [18]=NM_URNA_CANDIDATO
// [19]=NM_SOCIAL_CANDIDATO [20]=NR_CPF_CANDIDATO ...
const IDX_SEQUENCIAL = 15; // SQ_CANDIDATO
const IDX_CPF = 20;        // NR_CPF_CANDIDATO

async function readCsvCpfMap(filePath) {
  const map = new Map(); // sequencial -> cpf
  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) continue; // pular cabeçalho
    const cols = line.split(";");
    if (cols.length < 21) continue;
    // Remover aspas duplas que o TSE coloca em alguns campos
    const seq = cols[IDX_SEQUENCIAL]?.trim().replace(/^"|"$/g, "");
    const cpf = cols[IDX_CPF]?.trim().replace(/^"|"$/g, "").replace(/\D/g, ""); // só dígitos
    if (seq && cpf && cpf.length === 11 && cpf !== "00000000000") {
      map.set(seq, cpf);
    }
  }
  return map;
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Conectado ao banco de dados.");

  // ── 2022 ──────────────────────────────────────────────────────────────────
  console.log("\n=== Processando CSVs 2022 ===");
  const files2022 = readdirSync("/tmp/cand_2022")
    .filter(f => f.startsWith("consulta_cand_2022_") && f.endsWith(".csv"))
    .map(f => path.join("/tmp/cand_2022", f));
  const map2022 = new Map();
  for (const f of files2022) {
    const uf = path.basename(f).replace("consulta_cand_2022_", "").replace(".csv", "");
    if (uf === "BR") continue;
    const partial = await readCsvCpfMap(f);
    for (const [k, v] of partial) map2022.set(k, v);
    process.stdout.write(`  ${uf}: ${partial.size} CPFs lidos\r`);
  }
  console.log(`\nTotal CPFs 2022: ${map2022.size.toLocaleString()}`);

  // ── 2020 ──────────────────────────────────────────────────────────────────
  console.log("\n=== Processando CSV 2020 ===");
  const map2020 = await readCsvCpfMap("/tmp/cand_2020/consulta_cand_2020_BRASIL.csv");
  console.log(`Total CPFs 2020: ${map2020.size.toLocaleString()}`);

  // ── Atualizar banco ────────────────────────────────────────────────────────
  for (const [ano, cpfMap] of [[2022, map2022], [2020, map2020]]) {
    console.log(`\n=== Atualizando banco para ${ano} ===`);

    // Buscar todos os sequenciais sem CPF desse ano
    const [rows] = await conn.query(
      "SELECT DISTINCT candidatoSequencial FROM candidate_results WHERE ano = ? AND cpf IS NULL",
      [ano]
    );
    console.log(`  Candidatos sem CPF: ${rows.length.toLocaleString()}`);

    let updated = 0;
    let notFound = 0;
    const BATCH = 500;

    // Agrupar atualizações em lotes
    const updates = [];
    for (const { candidatoSequencial } of rows) {
      const cpf = cpfMap.get(candidatoSequencial);
      if (cpf) {
        updates.push([cpf, candidatoSequencial, ano]);
      } else {
        notFound++;
      }
    }

    console.log(`  Com CPF encontrado: ${updates.length.toLocaleString()} | Sem match: ${notFound.toLocaleString()}`);

    for (let i = 0; i < updates.length; i += BATCH) {
      const batch = updates.slice(i, i + BATCH);
      // UPDATE em lote usando CASE WHEN
      const cases = batch.map(() => "WHEN candidatoSequencial = ? THEN ?").join(" ");
      const seqs = batch.map(([, seq]) => seq);
      const params = batch.flatMap(([cpf, seq]) => [seq, cpf]);
      await conn.query(
        `UPDATE candidate_results SET cpf = CASE ${cases} END WHERE candidatoSequencial IN (${seqs.map(() => "?").join(",")}) AND ano = ?`,
        [...params, ...seqs, ano]
      );
      updated += batch.length;
      if (updated % 5000 === 0 || updated === updates.length) {
        process.stdout.write(`  Progresso: ${updated.toLocaleString()}/${updates.length.toLocaleString()}\r`);
      }
    }
    console.log(`\n  Concluído: ${updated.toLocaleString()} registros atualizados.`);
  }

  // ── Verificação final ──────────────────────────────────────────────────────
  const [stats] = await conn.query(
    "SELECT ano, COUNT(*) as total, SUM(CASE WHEN cpf IS NOT NULL THEN 1 ELSE 0 END) as com_cpf FROM candidate_results GROUP BY ano ORDER BY ano"
  );
  console.log("\n=== Resultado final ===");
  for (const row of stats) {
    const pct = ((row.com_cpf / row.total) * 100).toFixed(1);
    console.log(`  ${row.ano}: ${row.com_cpf.toLocaleString()}/${row.total.toLocaleString()} com CPF (${pct}%)`);
  }

  await conn.end();
  console.log("\nImportação de CPFs concluída!");
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
