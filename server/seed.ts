import { getDb } from "./db";
import {
  parties,
  electionResultsByUf,
  electionSummary,
  candidates,
  municipalities,
} from "../drizzle/schema";
import {
  PARTIES_SEED,
  PSB_UF_RESULTS_2022,
  ELECTION_SUMMARIES,
  PSB_TOP_CANDIDATES,
  PARTY_COMPARISON_2022,
} from "./seed-data";

const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA",
  "MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN",
  "RO","RR","RS","SC","SE","SP","TO"
];

const CARGOS = ["PRESIDENTE", "GOVERNADOR", "SENADOR", "DEPUTADO FEDERAL", "DEPUTADO ESTADUAL"];
const ANOS = [2010, 2014, 2018, 2022];

// Dados de votos por partido e UF (amostra realista baseada em dados TSE)
const PARTY_UF_VOTES: Record<string, Record<string, number>> = {
  PT: { AC: 45000, AL: 198000, AM: 234000, AP: 67000, BA: 1456000, CE: 987000, DF: 87000, ES: 234000, GO: 345000, MA: 567000, MG: 1234000, MS: 123000, MT: 145000, PA: 567000, PB: 234000, PE: 876000, PI: 198000, PR: 456000, RJ: 876000, RN: 198000, RO: 89000, RR: 34000, RS: 567000, SC: 234000, SE: 145000, SP: 2345000, TO: 98000 },
  PSB: { AC: 8420, AL: 45230, AM: 38750, AP: 12340, BA: 312450, CE: 198760, DF: 37797, ES: 67890, GO: 89340, MA: 145670, MG: 287650, MS: 34560, MT: 41230, PA: 134560, PB: 98760, PE: 245670, PI: 87650, PR: 112340, RJ: 198760, RN: 112340, RO: 23450, RR: 8760, RS: 134560, SC: 78900, SE: 54320, SP: 456780, TO: 28760 },
  PL: { AC: 34000, AL: 156000, AM: 189000, AP: 56000, BA: 987000, CE: 765000, DF: 123000, ES: 198000, GO: 345000, MA: 456000, MG: 987000, MS: 145000, MT: 167000, PA: 456000, PB: 198000, PE: 567000, PI: 145000, PR: 567000, RJ: 987000, RN: 145000, RO: 78000, RR: 34000, RS: 678000, SC: 456000, SE: 123000, SP: 2987000, TO: 89000 },
  MDB: { AC: 23000, AL: 123000, AM: 145000, AP: 45000, BA: 678000, CE: 456000, DF: 89000, ES: 156000, GO: 234000, MA: 345000, MG: 765000, MS: 98000, MT: 112000, PA: 345000, PB: 156000, PE: 432000, PI: 112000, PR: 345000, RJ: 654000, RN: 134000, RO: 56000, RR: 23000, RS: 456000, SC: 312000, SE: 89000, SP: 1876000, TO: 67000 },
  PSDB: { AC: 19000, AL: 98000, AM: 123000, AP: 34000, BA: 456000, CE: 345000, DF: 67000, ES: 123000, GO: 198000, MA: 234000, MG: 654000, MS: 78000, MT: 89000, PA: 234000, PB: 123000, PE: 312000, PI: 89000, PR: 267000, RJ: 456000, RN: 98000, RO: 45000, RR: 19000, RS: 345000, SC: 234000, SE: 67000, SP: 1234000, TO: 56000 },
  PDT: { AC: 12000, AL: 78000, AM: 89000, AP: 23000, BA: 345000, CE: 432000, DF: 45000, ES: 89000, GO: 134000, MA: 198000, MG: 456000, MS: 56000, MT: 67000, PA: 198000, PB: 89000, PE: 234000, PI: 78000, PR: 198000, RJ: 345000, RN: 78000, RO: 34000, RR: 12000, RS: 267000, SC: 156000, SE: 56000, SP: 876000, TO: 45000 },
};

function generateVotesForPartyUfYear(partido: string, uf: string, ano: number): number {
  const base = PARTY_UF_VOTES[partido]?.[uf] ?? Math.floor(Math.random() * 50000 + 5000);
  const yearFactor: Record<number, number> = { 2010: 0.85, 2014: 1.0, 2018: 0.92, 2022: 0.88 };
  return Math.floor(base * (yearFactor[ano] ?? 1) * (0.9 + Math.random() * 0.2));
}

export async function seedDatabase(): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  try {
    // 1. Seed partidos
    for (const party of PARTIES_SEED) {
      await db.insert(parties).values(party).onDuplicateKeyUpdate({ set: { nome: party.nome, cor: party.cor } });
    }

    // 2. Seed municípios (amostra)
    const municipiosSample = [
      { codigoIbge: "3550308", nome: "SÃO PAULO", uf: "SP", regiao: "SUDESTE", lat: "-23.5505", lng: "-46.6333" },
      { codigoIbge: "3304557", nome: "RIO DE JANEIRO", uf: "RJ", regiao: "SUDESTE", lat: "-22.9068", lng: "-43.1729" },
      { codigoIbge: "2927408", nome: "SALVADOR", uf: "BA", regiao: "NORDESTE", lat: "-12.9714", lng: "-38.5014" },
      { codigoIbge: "2304400", nome: "FORTALEZA", uf: "CE", regiao: "NORDESTE", lat: "-3.7172", lng: "-38.5433" },
      { codigoIbge: "3106200", nome: "BELO HORIZONTE", uf: "MG", regiao: "SUDESTE", lat: "-19.9167", lng: "-43.9345" },
      { codigoIbge: "4106902", nome: "CURITIBA", uf: "PR", regiao: "SUL", lat: "-25.4297", lng: "-49.2711" },
      { codigoIbge: "4314902", nome: "PORTO ALEGRE", uf: "RS", regiao: "SUL", lat: "-30.0346", lng: "-51.2177" },
      { codigoIbge: "1302603", nome: "MANAUS", uf: "AM", regiao: "NORTE", lat: "-3.1019", lng: "-60.0250" },
      { codigoIbge: "2611606", nome: "RECIFE", uf: "PE", regiao: "NORDESTE", lat: "-8.0539", lng: "-34.8811" },
      { codigoIbge: "5300108", nome: "BRASÍLIA", uf: "DF", regiao: "CENTRO-OESTE", lat: "-15.7801", lng: "-47.9292" },
      { codigoIbge: "2800308", nome: "ARACAJU", uf: "SE", regiao: "NORDESTE", lat: "-10.9472", lng: "-37.0731" },
      { codigoIbge: "2111300", nome: "SÃO LUÍS", uf: "MA", regiao: "NORDESTE", lat: "-2.5297", lng: "-44.3028" },
      { codigoIbge: "2408102", nome: "NATAL", uf: "RN", regiao: "NORDESTE", lat: "-5.7945", lng: "-35.2110" },
      { codigoIbge: "2507507", nome: "JOÃO PESSOA", uf: "PB", regiao: "NORDESTE", lat: "-7.1195", lng: "-34.8450" },
      { codigoIbge: "2211001", nome: "TERESINA", uf: "PI", regiao: "NORDESTE", lat: "-5.0892", lng: "-42.8019" },
      { codigoIbge: "1501402", nome: "BELÉM", uf: "PA", regiao: "NORTE", lat: "-1.4558", lng: "-48.5044" },
      { codigoIbge: "5208707", nome: "GOIÂNIA", uf: "GO", regiao: "CENTRO-OESTE", lat: "-16.6869", lng: "-49.2648" },
      { codigoIbge: "5002704", nome: "CAMPO GRANDE", uf: "MS", regiao: "CENTRO-OESTE", lat: "-20.4428", lng: "-54.6460" },
      { codigoIbge: "5103403", nome: "CUIABÁ", uf: "MT", regiao: "CENTRO-OESTE", lat: "-15.5989", lng: "-56.0949" },
      { codigoIbge: "4205407", nome: "FLORIANÓPOLIS", uf: "SC", regiao: "SUL", lat: "-27.5954", lng: "-48.5480" },
    ];

    for (const mun of municipiosSample) {
      await db.insert(municipalities).values({
        codigoIbge: mun.codigoIbge,
        nome: mun.nome,
        uf: mun.uf,
        regiao: mun.regiao,
        lat: mun.lat,
        lng: mun.lng,
      }).onDuplicateKeyUpdate({ set: { nome: mun.nome } });
    }

    // 3. Seed resultados por UF (todos os anos, cargos principais)
    const mainParties = ["PT", "PSB", "PL", "MDB", "PSDB", "PDT", "PP", "PSD"];
    const mainCargos = ["DEPUTADO FEDERAL", "GOVERNADOR", "SENADOR"];

    for (const ano of ANOS) {
      for (const turno of [1]) {
        for (const cargo of mainCargos) {
          for (const uf of UF_LIST) {
            for (const partido of mainParties) {
              const votos = generateVotesForPartyUfYear(partido, uf, ano);
              await db.insert(electionResultsByUf).values({
                ano,
                turno,
                uf,
                cargo,
                partidoSigla: partido,
                totalVotos: votos,
                totalVotosValidos: Math.floor(votos * 0.95),
                percentualVotos: String((Math.random() * 15 + 1).toFixed(4)),
              }).onDuplicateKeyUpdate({ set: { totalVotos: votos } });
            }
          }
        }
      }
    }

    // 4. Seed candidatos PSB históricos
    for (const cand of PSB_TOP_CANDIDATES) {
      await db.insert(candidates).values({
        nome: cand.nome,
        nomeUrna: cand.nomeUrna,
        cargo: cand.cargo,
        ano: cand.ano,
        uf: cand.uf === "BR" ? null : cand.uf,
        partidoSigla: "PSB",
        situacao: "ELEITO",
      }).onDuplicateKeyUpdate({ set: { nome: cand.nome } });
    }

    // 5. Seed sumários eleitorais
    for (const summary of ELECTION_SUMMARIES) {
      await db.insert(electionSummary).values({
        ano: summary.ano,
        turno: summary.turno,
        cargo: summary.cargo,
        totalEleitores: summary.totalEleitores,
        totalComparecimento: summary.totalComparecimento,
        totalAbstencoes: summary.totalAbstencoes,
        totalVotosBranco: summary.totalVotosBranco,
        totalVotosNulos: summary.totalVotosNulos,
        totalVotosValidos: summary.totalVotosValidos,
        percentualComparecimento: String(summary.percentualComparecimento),
        percentualAbstencao: String(summary.percentualAbstencao),
      }).onDuplicateKeyUpdate({ set: { totalEleitores: summary.totalEleitores } });
    }

    return { success: true, message: "Banco de dados populado com dados eleitorais de amostra." };
  } catch (error) {
    console.error("[Seed] Error:", error);
    return { success: false, message: String(error) };
  }
}
