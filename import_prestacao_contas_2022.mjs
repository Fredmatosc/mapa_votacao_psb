/**
 * Importação da Prestação de Contas 2022
 * 
 * Baixa o ZIP do TSE, extrai receitas e despesas contratadas,
 * agrega por SQ_CANDIDATO e atualiza candidate_results.
 * 
 * Estratégia:
 * - Receita: arquivo receitas_candidatos_2022_BRASIL.csv → SUM(VR_RECEITA) por SQ_CANDIDATO
 * - Despesa: arquivo despesas_contratadas_candidatos_2022_BRASIL.csv → SUM(VR_DESPESA_CONTRATADA) por SQ_CANDIDATO
 *   (despesas contratadas = valor comprometido, mais completo que despesas pagas)
 */

import mysql from 'mysql2/promise';
import https from 'https';
import fs from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';
import path from 'path';
import { createInterface } from 'readline';

const execAsync = promisify(exec);

const DB_URL = process.env.DATABASE_URL;
const DOWNLOAD_DIR = '/tmp/pc2022';
const ZIP_URL = 'https://cdn.tse.jus.br/estatistica/sead/odsele/prestacao_contas/prestacao_de_contas_eleitorais_candidatos_2022.zip';
const ZIP_FILE = `${DOWNLOAD_DIR}/pc_2022.zip`;

// Parsear valor monetário brasileiro: "1.234,56" → 1234.56
function parseBRL(str) {
  if (!str || str === '#NULO' || str === '-1') return 0;
  const clean = str.replace(/"/g, '').trim();
  if (!clean || clean === '#NULO') return 0;
  // Remove pontos de milhar, troca vírgula por ponto
  return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
}

async function downloadFile(url, dest) {
  console.log(`Baixando: ${url}`);
  console.log(`Destino: ${dest}`);
  
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    let downloaded = 0;
    let lastLog = Date.now();
    
    const request = https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      const total = parseInt(response.headers['content-length'] || '0');
      
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (Date.now() - lastLog > 10000) {
          const pct = total ? ((downloaded / total) * 100).toFixed(1) : '?';
          console.log(`  ${(downloaded / 1048576).toFixed(1)} MB / ${(total / 1048576).toFixed(1)} MB (${pct}%)`);
          lastLog = Date.now();
        }
      });
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`  Download concluído: ${(downloaded / 1048576).toFixed(1)} MB`);
        resolve();
      });
    });
    
    request.on('error', reject);
    file.on('error', reject);
  });
}

async function processCSVStream(csvPath, fieldMap, aggregator) {
  /**
   * fieldMap: { sqCandidato: colIndex, valor: colIndex }
   * aggregator: Map<sqCandidato, number>
   */
  return new Promise((resolve, reject) => {
    const rl = createInterface({
      input: createReadStream(csvPath, { encoding: 'latin1' }),
      crlfDelay: Infinity,
    });
    
    let lineNum = 0;
    let headerParsed = false;
    let sqCol = -1;
    let valCol = -1;
    let processed = 0;
    let lastLog = Date.now();
    
    rl.on('line', (line) => {
      lineNum++;
      
      if (!headerParsed) {
        // Parse header
        const cols = line.split(';').map(c => c.replace(/"/g, '').trim());
        sqCol = cols.indexOf(fieldMap.sqCandidato);
        valCol = cols.indexOf(fieldMap.valor);
        
        if (sqCol === -1 || valCol === -1) {
          console.error(`  ERRO: Colunas não encontradas. sqCandidato=${sqCol}, valor=${valCol}`);
          console.error(`  Colunas disponíveis: ${cols.slice(0, 30).join(', ')}`);
          rl.close();
          return;
        }
        
        console.log(`  Header: ${fieldMap.sqCandidato}@col${sqCol}, ${fieldMap.valor}@col${valCol}`);
        headerParsed = true;
        return;
      }
      
      // Parse data line
      const cols = line.split(';');
      if (cols.length <= Math.max(sqCol, valCol)) return;
      
      const sq = cols[sqCol]?.replace(/"/g, '').trim();
      const val = parseBRL(cols[valCol]);
      
      if (sq && sq !== '#NULO' && sq !== '-1' && val > 0) {
        aggregator.set(sq, (aggregator.get(sq) || 0) + val);
      }
      
      processed++;
      if (Date.now() - lastLog > 15000) {
        console.log(`  Processadas ${processed.toLocaleString()} linhas, ${aggregator.size.toLocaleString()} candidatos únicos...`);
        lastLog = Date.now();
      }
    });
    
    rl.on('close', () => {
      console.log(`  Total: ${processed.toLocaleString()} linhas, ${aggregator.size.toLocaleString()} candidatos únicos`);
      resolve();
    });
    
    rl.on('error', reject);
  });
}

async function main() {
  console.log('=== IMPORTAÇÃO PRESTAÇÃO DE CONTAS 2022 ===\n');
  
  // 1. Criar diretório de trabalho
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }
  
  // 2. Download do ZIP
  if (!fs.existsSync(ZIP_FILE)) {
    await downloadFile(ZIP_URL, ZIP_FILE);
  } else {
    const stat = fs.statSync(ZIP_FILE);
    console.log(`ZIP já existe: ${(stat.size / 1048576).toFixed(1)} MB`);
  }
  
  // 3. Verificar integridade
  try {
    const { stdout } = await execAsync(`unzip -t ${ZIP_FILE} 2>&1 | tail -3`);
    console.log(`Integridade ZIP: ${stdout.trim()}`);
  } catch (e) {
    console.log('Aviso: verificação de integridade falhou, continuando...');
  }
  
  // 4. Extrair apenas os arquivos BRASIL (maiores, mais completos)
  console.log('\nExtraindo arquivos BRASIL do ZIP...');
  const extractDir = `${DOWNLOAD_DIR}/extracted`;
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }
  
  try {
    await execAsync(`unzip -o ${ZIP_FILE} "receitas_candidatos_2022_BRASIL.csv" "despesas_contratadas_candidatos_2022_BRASIL.csv" -d ${extractDir} 2>&1`);
    console.log('Extração concluída');
  } catch (e) {
    // Pode não ter o arquivo BRASIL - tentar por estado
    console.log('Arquivo BRASIL não encontrado, extraindo por estado...');
    await execAsync(`unzip -o ${ZIP_FILE} "receitas_candidatos_2022_*.csv" "despesas_contratadas_candidatos_2022_*.csv" -d ${extractDir} 2>&1`);
    console.log('Extração por estado concluída');
  }
  
  // Listar arquivos extraídos
  const { stdout: fileList } = await execAsync(`ls -lh ${extractDir}/*.csv 2>/dev/null | head -20`);
  console.log('Arquivos extraídos:\n' + fileList);
  
  // 5. Processar receitas
  console.log('\n--- PROCESSANDO RECEITAS ---');
  const receitaMap = new Map(); // sq_candidato → total_receita
  
  const receitaBrasil = `${extractDir}/receitas_candidatos_2022_BRASIL.csv`;
  if (fs.existsSync(receitaBrasil)) {
    console.log('Usando arquivo BRASIL...');
    await processCSVStream(receitaBrasil, { sqCandidato: 'SQ_CANDIDATO', valor: 'VR_RECEITA' }, receitaMap);
  } else {
    // Processar por estado
    const { stdout: recFiles } = await execAsync(`ls ${extractDir}/receitas_candidatos_2022_*.csv 2>/dev/null`);
    const files = recFiles.trim().split('\n').filter(f => f && !f.includes('BRASIL') && !f.includes('doador'));
    console.log(`Processando ${files.length} arquivos de receita por estado...`);
    for (const f of files) {
      const uf = path.basename(f).replace('receitas_candidatos_2022_', '').replace('.csv', '');
      process.stdout.write(`  ${uf}... `);
      await processCSVStream(f, { sqCandidato: 'SQ_CANDIDATO', valor: 'VR_RECEITA' }, receitaMap);
    }
  }
  
  console.log(`\nReceitas agregadas: ${receitaMap.size.toLocaleString()} candidatos`);
  
  // 6. Processar despesas contratadas
  console.log('\n--- PROCESSANDO DESPESAS CONTRATADAS ---');
  const despesaMap = new Map(); // sq_candidato → total_despesa
  
  const despesaBrasil = `${extractDir}/despesas_contratadas_candidatos_2022_BRASIL.csv`;
  if (fs.existsSync(despesaBrasil)) {
    console.log('Usando arquivo BRASIL...');
    await processCSVStream(despesaBrasil, { sqCandidato: 'SQ_CANDIDATO', valor: 'VR_DESPESA_CONTRATADA' }, despesaMap);
  } else {
    const { stdout: despFiles } = await execAsync(`ls ${extractDir}/despesas_contratadas_candidatos_2022_*.csv 2>/dev/null`);
    const files = despFiles.trim().split('\n').filter(f => f && !f.includes('BRASIL'));
    console.log(`Processando ${files.length} arquivos de despesa por estado...`);
    for (const f of files) {
      const uf = path.basename(f).replace('despesas_contratadas_candidatos_2022_', '').replace('.csv', '');
      process.stdout.write(`  ${uf}... `);
      await processCSVStream(f, { sqCandidato: 'SQ_CANDIDATO', valor: 'VR_DESPESA_CONTRATADA' }, despesaMap);
    }
  }
  
  console.log(`\nDespesas agregadas: ${despesaMap.size.toLocaleString()} candidatos`);
  
  // 7. Atualizar banco de dados
  console.log('\n--- ATUALIZANDO BANCO DE DADOS ---');
  
  const conn = await mysql.createConnection(DB_URL);
  
  // Obter todos os candidatos de 2022 com seus sequenciais
  const [rows] = await conn.execute(
    'SELECT id, candidatoSequencial FROM candidate_results WHERE ano = 2022'
  );
  
  console.log(`Candidatos em candidate_results (2022): ${rows.length.toLocaleString()}`);
  
  let updated = 0;
  let notFound = 0;
  let batchSize = 500;
  
  // Construir batch de updates
  const updates = [];
  for (const row of rows) {
    const sq = row.candidatoSequencial;
    const receita = receitaMap.get(sq) || null;
    const despesa = despesaMap.get(sq) || null;
    
    if (receita !== null || despesa !== null) {
      updates.push({ id: row.id, receita, despesa });
    } else {
      notFound++;
    }
  }
  
  console.log(`Candidatos com dados financeiros: ${updates.length.toLocaleString()}`);
  console.log(`Candidatos sem dados financeiros: ${notFound.toLocaleString()}`);
  
  // Executar updates em batches
  console.log(`\nAtualizando ${updates.length.toLocaleString()} registros em batches de ${batchSize}...`);
  let lastLogTime = Date.now();
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    // Usar INSERT INTO ... ON DUPLICATE KEY UPDATE para eficiência
    // Ou UPDATE com CASE WHEN
    const cases_receita = batch.map(u => `WHEN id = ${u.id} THEN ${u.receita !== null ? u.receita : 'NULL'}`).join(' ');
    const cases_despesa = batch.map(u => `WHEN id = ${u.id} THEN ${u.despesa !== null ? u.despesa : 'NULL'}`).join(' ');
    const ids = batch.map(u => u.id).join(',');
    
    await conn.execute(`
      UPDATE candidate_results 
      SET 
        receitaTotal = CASE ${cases_receita} ELSE receitaTotal END,
        despesaTotal = CASE ${cases_despesa} ELSE despesaTotal END
      WHERE id IN (${ids})
    `);
    
    updated += batch.length;
    
    if (Date.now() - lastLogTime > 5000) {
      console.log(`  ${updated.toLocaleString()} / ${updates.length.toLocaleString()} atualizados...`);
      lastLogTime = Date.now();
    }
  }
  
  await conn.end();
  
  console.log(`\n✓ Atualização concluída: ${updated.toLocaleString()} candidatos com dados financeiros`);
  
  // 8. Verificação rápida
  console.log('\n--- VERIFICAÇÃO ---');
  const conn2 = await mysql.createConnection(DB_URL);
  const [check] = await conn2.execute(`
    SELECT 
      COUNT(*) as total,
      COUNT(receitaTotal) as com_receita,
      COUNT(despesaTotal) as com_despesa,
      ROUND(AVG(receitaTotal), 2) as media_receita,
      ROUND(AVG(despesaTotal), 2) as media_despesa,
      MAX(receitaTotal) as max_receita,
      MAX(despesaTotal) as max_despesa
    FROM candidate_results 
    WHERE ano = 2022
  `);
  
  const r = check[0];
  console.log(`Total candidatos 2022: ${r.total}`);
  console.log(`Com receita: ${r.com_receita} (${((r.com_receita/r.total)*100).toFixed(1)}%)`);
  console.log(`Com despesa: ${r.com_despesa} (${((r.com_despesa/r.total)*100).toFixed(1)}%)`);
  console.log(`Média receita: R$ ${Number(r.media_receita).toLocaleString('pt-BR', {minimumFractionDigits:2})}`);
  console.log(`Média despesa: R$ ${Number(r.media_despesa).toLocaleString('pt-BR', {minimumFractionDigits:2})}`);
  console.log(`Maior receita: R$ ${Number(r.max_receita).toLocaleString('pt-BR', {minimumFractionDigits:2})}`);
  console.log(`Maior despesa: R$ ${Number(r.max_despesa).toLocaleString('pt-BR', {minimumFractionDigits:2})}`);
  
  await conn2.end();
  
  // 9. Limpeza
  console.log('\nLimpando arquivos temporários...');
  await execAsync(`rm -rf ${DOWNLOAD_DIR}`);
  
  console.log('\n=== IMPORTAÇÃO CONCLUÍDA COM SUCESSO ===');
}

main().catch(err => {
  console.error('ERRO FATAL:', err);
  process.exit(1);
});
