import { and, desc, eq, ilike, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, candidateResults, candidateZoneResults, candidates, electoralZones, electionResultsByMunicipality, electionResultsByUf, electionResultsByZone, electionSummary, municipalities, parties, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Partidos ───────────────────────────────────────────────────────────────

export async function getAllParties() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parties).orderBy(parties.sigla);
}

// ─── Municípios ─────────────────────────────────────────────────────────────

export async function getMunicipalitiesByUf(uf: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(municipalities).where(eq(municipalities.uf, uf)).orderBy(municipalities.nome);
}

export async function searchMunicipalities(query: string, uf?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [like(municipalities.nome, `%${query}%`)];
  if (uf) conditions.push(eq(municipalities.uf, uf));
  return db.select().from(municipalities).where(and(...conditions)).limit(20);
}

// ─── Resultados por UF ──────────────────────────────────────────────────────

export async function getResultsByUf(filters: {
  ano?: number;
  turno?: number;
  cargo?: string;
  partidoSigla?: string;
  uf?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.ano) conditions.push(eq(electionResultsByUf.ano, filters.ano));
  if (filters.turno) conditions.push(eq(electionResultsByUf.turno, filters.turno));
  if (filters.cargo) conditions.push(eq(electionResultsByUf.cargo, filters.cargo));
  if (filters.partidoSigla) conditions.push(eq(electionResultsByUf.partidoSigla, filters.partidoSigla));
  if (filters.uf) conditions.push(eq(electionResultsByUf.uf, filters.uf));

  // Aggregate by UF to return one row per state
  const query = db
    .select({
      uf: electionResultsByUf.uf,
      totalVotos: sql<number>`SUM(${electionResultsByUf.totalVotos})`,
      totalVotosValidos: sql<number>`SUM(${electionResultsByUf.totalVotosValidos})`,
      percentualVotos: sql<string>`AVG(${electionResultsByUf.percentualVotos})`,
    })
    .from(electionResultsByUf)
    .groupBy(electionResultsByUf.uf);

  if (conditions.length > 0) {
    return (query as any).where(and(...conditions)).orderBy(sql`SUM(${electionResultsByUf.totalVotos}) DESC`);
  }
  return (query as any).orderBy(sql`SUM(${electionResultsByUf.totalVotos}) DESC`);
}

export async function getMapDataByUf(filters: {
  ano: number;
  turno: number;
  cargo: string;
  partidoSigla?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [
    eq(electionResultsByUf.ano, filters.ano),
    eq(electionResultsByUf.turno, filters.turno),
    eq(electionResultsByUf.cargo, filters.cargo),
  ];
  if (filters.partidoSigla) conditions.push(eq(electionResultsByUf.partidoSigla, filters.partidoSigla));

  const results = await db
    .select({
      uf: electionResultsByUf.uf,
      totalVotos: sql<number>`SUM(${electionResultsByUf.totalVotos})`,
      totalVotosValidos: sql<number>`SUM(${electionResultsByUf.totalVotosValidos})`,
      percentualVotos: sql<number>`AVG(${electionResultsByUf.percentualVotos})`,
    })
    .from(electionResultsByUf)
    .where(and(...conditions))
    .groupBy(electionResultsByUf.uf)
    .orderBy(desc(sql`SUM(${electionResultsByUf.totalVotos})`));

  return results;
}

// ─── Resultados por Município ────────────────────────────────────────────────

export async function getResultsByMunicipality(filters: {
  ano?: number;
  turno?: number;
  cargo?: string;
  partidoSigla?: string;
  uf?: string;
  codigoMunicipio?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.ano) conditions.push(eq(electionResultsByMunicipality.ano, filters.ano));
  if (filters.turno) conditions.push(eq(electionResultsByMunicipality.turno, filters.turno));
  if (filters.cargo) conditions.push(eq(electionResultsByMunicipality.cargo, filters.cargo));
  if (filters.partidoSigla) conditions.push(eq(electionResultsByMunicipality.partidoSigla, filters.partidoSigla));
  if (filters.uf) conditions.push(eq(electionResultsByMunicipality.uf, filters.uf));
  if (filters.codigoMunicipio) conditions.push(eq(electionResultsByMunicipality.codigoMunicipio, filters.codigoMunicipio));

  const query = db.select().from(electionResultsByMunicipality);
  const withWhere = conditions.length > 0 ? query.where(and(...conditions)) : query;
  return withWhere.orderBy(desc(electionResultsByMunicipality.totalVotos)).limit(filters.limit ?? 100);
}

// ─── Resultados por Zona ─────────────────────────────────────────────────────

export async function getResultsByZone(filters: {
  ano?: number;
  turno?: number;
  cargo?: string;
  partidoSigla?: string;
  uf?: string;
  codigoMunicipio?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.ano) conditions.push(eq(electionResultsByZone.ano, filters.ano));
  if (filters.turno) conditions.push(eq(electionResultsByZone.turno, filters.turno));
  if (filters.cargo) conditions.push(eq(electionResultsByZone.cargo, filters.cargo));
  if (filters.partidoSigla) conditions.push(eq(electionResultsByZone.partidoSigla, filters.partidoSigla));
  if (filters.uf) conditions.push(eq(electionResultsByZone.uf, filters.uf));
  if (filters.codigoMunicipio) conditions.push(eq(electionResultsByZone.codigoMunicipio, filters.codigoMunicipio));

  const query = db.select().from(electionResultsByZone);
  const withWhere = conditions.length > 0 ? query.where(and(...conditions)) : query;
  return withWhere.orderBy(desc(electionResultsByZone.totalVotos)).limit(200);
}

// ─── Candidatos ──────────────────────────────────────────────────────────────

export async function searchCandidates(query: string, filters?: { ano?: number; cargo?: string; uf?: string; partidoSigla?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [
    or(
      like(candidates.nome, `%${query}%`),
      like(candidates.nomeUrna, `%${query}%`)
    )!
  ];
  if (filters?.ano) conditions.push(eq(candidates.ano, filters.ano));
  if (filters?.cargo) conditions.push(eq(candidates.cargo, filters.cargo));
  if (filters?.uf) conditions.push(eq(candidates.uf, filters.uf));
  if (filters?.partidoSigla) conditions.push(eq(candidates.partidoSigla, filters.partidoSigla));

  return db.select().from(candidates).where(and(...conditions)).limit(20);
}

// ─── Sumário / KPIs ──────────────────────────────────────────────────────────

export async function getElectionSummary(filters: { ano?: number; turno?: number; cargo?: string; uf?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.ano) conditions.push(eq(electionSummary.ano, filters.ano));
  if (filters.turno) conditions.push(eq(electionSummary.turno, filters.turno));
  if (filters.cargo) conditions.push(eq(electionSummary.cargo, filters.cargo));
  if (filters.uf) conditions.push(eq(electionSummary.uf, filters.uf));

  const query = db.select().from(electionSummary);
  return conditions.length > 0 ? query.where(and(...conditions)) : query;
}

// ─── Ranking ─────────────────────────────────────────────────────────────────

export async function getRankingByUf(filters: { ano: number; turno: number; cargo: string; uf: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(electionResultsByUf)
    .where(and(
      eq(electionResultsByUf.ano, filters.ano),
      eq(electionResultsByUf.turno, filters.turno),
      eq(electionResultsByUf.cargo, filters.cargo),
      eq(electionResultsByUf.uf, filters.uf),
    ))
    .orderBy(desc(electionResultsByUf.totalVotos))
    .limit(filters.limit ?? 20);
}

// ─── Evolução Temporal ───────────────────────────────────────────────────────

export async function getTemporalEvolution(filters: { cargo: string; partidoSigla?: string; uf?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(electionResultsByUf.cargo, filters.cargo)];
  if (filters.partidoSigla) conditions.push(eq(electionResultsByUf.partidoSigla, filters.partidoSigla));
  if (filters.uf) conditions.push(eq(electionResultsByUf.uf, filters.uf));

  return db
    .select({
      ano: electionResultsByUf.ano,
      turno: electionResultsByUf.turno,
      totalVotos: sql<number>`SUM(${electionResultsByUf.totalVotos})`,
      percentualVotos: sql<number>`AVG(${electionResultsByUf.percentualVotos})`,
    })
    .from(electionResultsByUf)
    .where(and(...conditions))
    .groupBy(electionResultsByUf.ano, electionResultsByUf.turno)
    .orderBy(electionResultsByUf.ano);
}

// ─── Candidatos por UF (drill-down) ─────────────────────────────────────────

export async function getCandidatesByUf(filters: {
  ano: number;
  turno: number;
  cargo: string;
  uf: string;
  partidoSigla?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [
    eq(candidateResults.ano, filters.ano),
    eq(candidateResults.turno, filters.turno),
    eq(candidateResults.cargo, filters.cargo),
    eq(candidateResults.uf, filters.uf),
  ];
  if (filters.partidoSigla) conditions.push(eq(candidateResults.partidoSigla, filters.partidoSigla));

  // Deduplicate by candidatoSequencial - take the one with max votes (in case of duplicates)
  return db
    .select({
      id: sql<number>`MIN(${candidateResults.id})`,
      candidatoSequencial: candidateResults.candidatoSequencial,
      candidatoNome: candidateResults.candidatoNome,
      candidatoNomeUrna: candidateResults.candidatoNomeUrna,
      candidatoNumero: candidateResults.candidatoNumero,
      partidoSigla: candidateResults.partidoSigla,
      uf: candidateResults.uf,
      cargo: candidateResults.cargo,
      ano: candidateResults.ano,
      turno: candidateResults.turno,
      totalVotos: sql<number>`MAX(${candidateResults.totalVotos})`,
      totalVotosPartido: candidateResults.totalVotosPartido,
      percentualSobrePartido: candidateResults.percentualSobrePartido,
      situacao: candidateResults.situacao,
      eleito: candidateResults.eleito,
    })
    .from(candidateResults)
    .where(and(...conditions))
    .groupBy(
      candidateResults.candidatoSequencial,
      candidateResults.candidatoNome,
      candidateResults.candidatoNomeUrna,
      candidateResults.candidatoNumero,
      candidateResults.partidoSigla,
      candidateResults.uf,
      candidateResults.cargo,
      candidateResults.ano,
      candidateResults.turno,
      candidateResults.totalVotosPartido,
      candidateResults.percentualSobrePartido,
      candidateResults.situacao,
      candidateResults.eleito,
    )
    .orderBy(desc(sql`MAX(${candidateResults.totalVotos})`))
    .limit(filters.limit ?? 100);
}

export async function getCandidateZoneDetail(filters: {
  candidatoSequencial: string;
  ano: number;
  turno: number;
  uf?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [
    eq(candidateZoneResults.candidatoSequencial, filters.candidatoSequencial),
    eq(candidateZoneResults.ano, filters.ano),
    eq(candidateZoneResults.turno, filters.turno),
  ];
  if (filters.uf) conditions.push(eq(candidateZoneResults.uf, filters.uf));

  return db
    .select()
    .from(candidateZoneResults)
    .where(and(...conditions))
    .orderBy(desc(candidateZoneResults.totalVotos))
    .limit(500);
}

export async function getCandidateZoneByMunicipality(filters: {
  candidatoSequencial: string;
  ano: number;
  turno: number;
  uf?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [
    eq(candidateZoneResults.candidatoSequencial, filters.candidatoSequencial),
    eq(candidateZoneResults.ano, filters.ano),
    eq(candidateZoneResults.turno, filters.turno),
  ];
  if (filters.uf) conditions.push(eq(candidateZoneResults.uf, filters.uf));

  // Aggregate by municipality
  return db
    .select({
      codigoMunicipio: candidateZoneResults.codigoMunicipio,
      nomeMunicipio: candidateZoneResults.nomeMunicipio,
      totalVotos: sql<number>`SUM(${candidateZoneResults.totalVotos})`,
      zonas: sql<number>`COUNT(DISTINCT ${candidateZoneResults.numeroZona})`,
    })
    .from(candidateZoneResults)
    .where(and(...conditions))
    .groupBy(candidateZoneResults.codigoMunicipio, candidateZoneResults.nomeMunicipio)
    .orderBy(desc(sql`SUM(${candidateZoneResults.totalVotos})`))
    .limit(200);
}

// ─── Resumo Eleitoral Contextual (todos os candidatos, todos os partidos) ────

export async function getElectionContextSummary(filters: {
  ano: number;
  turno: number;
  cargo: string;
  uf: string;
  codigoMunicipio?: string;
  partidoSigla?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return { candidates: [], summary: null };

  const conditions = [
    eq(candidateResults.ano, filters.ano),
    eq(candidateResults.turno, filters.turno),
    eq(candidateResults.cargo, filters.cargo),
    eq(candidateResults.uf, filters.uf),
  ];
  if (filters.partidoSigla) conditions.push(eq(candidateResults.partidoSigla, filters.partidoSigla));

  // Get all candidates for this context (all parties unless filtered)
  const allCandidates = await db
    .select({
      id: sql<number>`MIN(${candidateResults.id})`,
      candidatoSequencial: candidateResults.candidatoSequencial,
      candidatoNome: candidateResults.candidatoNome,
      candidatoNomeUrna: candidateResults.candidatoNomeUrna,
      candidatoNumero: candidateResults.candidatoNumero,
      partidoSigla: candidateResults.partidoSigla,
      uf: candidateResults.uf,
      cargo: candidateResults.cargo,
      ano: candidateResults.ano,
      turno: candidateResults.turno,
      totalVotos: sql<number>`MAX(${candidateResults.totalVotos})`,
      totalVotosPartido: candidateResults.totalVotosPartido,
      percentualSobrePartido: candidateResults.percentualSobrePartido,
      situacao: candidateResults.situacao,
      eleito: candidateResults.eleito,
    })
    .from(candidateResults)
    .where(and(...conditions))
    .groupBy(
      candidateResults.candidatoSequencial,
      candidateResults.candidatoNome,
      candidateResults.candidatoNomeUrna,
      candidateResults.candidatoNumero,
      candidateResults.partidoSigla,
      candidateResults.uf,
      candidateResults.cargo,
      candidateResults.ano,
      candidateResults.turno,
      candidateResults.totalVotosPartido,
      candidateResults.percentualSobrePartido,
      candidateResults.situacao,
      candidateResults.eleito,
    )
    .orderBy(desc(sql`MAX(${candidateResults.totalVotos})`))
    .limit(filters.limit ?? 500);

  // Compute summary stats
  const totalVotos = allCandidates.reduce((sum, c) => sum + (c.totalVotos ?? 0), 0);
  const totalEleitos = allCandidates.filter(c => c.eleito).length;
  const totalCandidatos = allCandidates.length;
  const partidos = Array.from(new Set(allCandidates.map(c => c.partidoSigla))).sort();

  // Aggregate by party
  const byParty = partidos.map(sigla => {
    const partyCandidates = allCandidates.filter(c => c.partidoSigla === sigla);
    return {
      sigla,
      totalVotos: partyCandidates.reduce((sum, c) => sum + (c.totalVotos ?? 0), 0),
      candidatos: partyCandidates.length,
      eleitos: partyCandidates.filter(c => c.eleito).length,
    };
  }).sort((a, b) => b.totalVotos - a.totalVotos);

  return {
    candidates: allCandidates,
    summary: {
      totalVotos,
      totalEleitos,
      totalCandidatos,
      totalPartidos: partidos.length,
      byParty,
    },
  };
}

// ─── Resumo Eleitoral por Município ────────────────────────────────────────────

export async function getElectionContextByMunicipality(filters: {
  ano: number;
  turno: number;
  cargo: string;
  uf: string;
  nomeMunicipio: string;
  partidoSigla?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return { candidates: [], summary: null };

  const conditions = [
    eq(candidateZoneResults.ano, filters.ano),
    eq(candidateZoneResults.turno, filters.turno),
    eq(candidateZoneResults.cargo, filters.cargo),
    eq(candidateZoneResults.uf, filters.uf),
    eq(candidateZoneResults.nomeMunicipio, filters.nomeMunicipio),
  ];
  if (filters.partidoSigla) conditions.push(eq(candidateZoneResults.partidoSigla, filters.partidoSigla));

  // Aggregate votes per candidate across all zones in the municipality
  // JOIN with candidateResults to get situacao/eleito
  const rows = await db
    .select({
      candidatoSequencial: candidateZoneResults.candidatoSequencial,
      candidatoNome: candidateZoneResults.candidatoNome,
      candidatoNomeUrna: candidateZoneResults.candidatoNomeUrna,
      candidatoNumero: candidateResults.candidatoNumero,
      partidoSigla: candidateZoneResults.partidoSigla,
      nomeMunicipio: candidateZoneResults.nomeMunicipio,
      totalVotos: sql<number>`SUM(${candidateZoneResults.totalVotos})`,
      situacao: sql<string>`MAX(${candidateResults.situacao})`,
      eleito: sql<number>`MAX(CASE WHEN ${candidateResults.eleito} = 1 THEN 1 ELSE 0 END)`,
      zonas: sql<number>`COUNT(DISTINCT ${candidateZoneResults.numeroZona})`,
    })
    .from(candidateZoneResults)
    .leftJoin(
      candidateResults,
      and(
        eq(candidateZoneResults.candidatoSequencial, candidateResults.candidatoSequencial),
        eq(candidateZoneResults.ano, candidateResults.ano),
        eq(candidateZoneResults.turno, candidateResults.turno),
        eq(candidateZoneResults.uf, candidateResults.uf),
      )
    )
    .where(and(...conditions))
    .groupBy(
      candidateZoneResults.candidatoSequencial,
      candidateZoneResults.candidatoNome,
      candidateZoneResults.candidatoNomeUrna,
      candidateResults.candidatoNumero,
      candidateZoneResults.partidoSigla,
      candidateZoneResults.nomeMunicipio,
    )
    .orderBy(desc(sql`SUM(${candidateZoneResults.totalVotos})`))
    .limit(filters.limit ?? 500);

  const candidates = rows.map(r => ({
    ...r,
    eleito: Boolean(r.eleito),
    percentualSobrePartido: null as string | null,
  }));

  // Compute totals
  const totalVotos = candidates.reduce((sum, c) => sum + (c.totalVotos ?? 0), 0);
  const totalEleitos = candidates.filter(c => c.eleito).length;
  const totalCandidatos = candidates.length;
  const partidos = Array.from(new Set(candidates.map(c => c.partidoSigla))).sort();

  const byParty = partidos.map(sigla => {
    const pc = candidates.filter(c => c.partidoSigla === sigla);
    return {
      sigla,
      totalVotos: pc.reduce((sum, c) => sum + (c.totalVotos ?? 0), 0),
      candidatos: pc.length,
      eleitos: pc.filter(c => c.eleito).length,
    };
  }).sort((a, b) => b.totalVotos - a.totalVotos);

  return {
    candidates,
    summary: { totalVotos, totalEleitos, totalCandidatos, totalPartidos: partidos.length, byParty },
  };
}

// ─── Lista de Municípios com Dados Eleitorais ────────────────────────────────

export async function getMunicipalitiesWithData(filters: {
  ano: number;
  cargo: string;
  uf: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .selectDistinct({
      nomeMunicipio: candidateZoneResults.nomeMunicipio,
      codigoMunicipio: candidateZoneResults.codigoMunicipio,
    })
    .from(candidateZoneResults)
    .where(and(
      eq(candidateZoneResults.ano, filters.ano),
      eq(candidateZoneResults.cargo, filters.cargo),
      eq(candidateZoneResults.uf, filters.uf),
    ))
    .orderBy(candidateZoneResults.nomeMunicipio);

  return rows.filter(r => r.nomeMunicipio != null);
}

// ─── Comparação entre Partidos ───────────────────────────────────────────────

export async function getPartyComparison(filters: { ano: number; turno: number; cargo: string; uf?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [
    eq(electionResultsByUf.ano, filters.ano),
    eq(electionResultsByUf.turno, filters.turno),
    eq(electionResultsByUf.cargo, filters.cargo),
  ];
  if (filters.uf) conditions.push(eq(electionResultsByUf.uf, filters.uf));

  return db
    .select({
      partidoSigla: electionResultsByUf.partidoSigla,
      totalVotos: sql<number>`SUM(${electionResultsByUf.totalVotos})`,
      percentualVotos: sql<number>`AVG(${electionResultsByUf.percentualVotos})`,
    })
    .from(electionResultsByUf)
    .where(and(...conditions))
    .groupBy(electionResultsByUf.partidoSigla)
    .orderBy(desc(sql`SUM(${electionResultsByUf.totalVotos})`))
    .limit(20);
}

// ─── Contagem de Eleitos ─────────────────────────────────────────────────────

export async function countEleitosByParty(filters: {
  ano: number;
  turno: number;
  cargo: string;
  partidoSigla?: string;
  uf?: string;
}) {
  const db = await getDb();
  if (!db) return { total: 0 };

  const conditions = [
    eq(candidateResults.ano, filters.ano),
    eq(candidateResults.turno, filters.turno),
    eq(candidateResults.cargo, filters.cargo),
    eq(candidateResults.eleito, true),
  ];
  if (filters.partidoSigla) conditions.push(eq(candidateResults.partidoSigla, filters.partidoSigla));
  if (filters.uf) conditions.push(eq(candidateResults.uf, filters.uf));

  const rows = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(candidateResults)
    .where(and(...conditions));

  return { total: Number(rows[0]?.total ?? 0) };
}

// ─── Zonas Eleitorais com Georreferenciamento ────────────────────────────────
export async function getZoneInfo(uf: string, numeroZona: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(electoralZones)
    .where(and(eq(electoralZones.uf, uf), eq(electoralZones.numeroZona, numeroZona)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getZoneInfoBatch(uf: string, zonas: string[]) {
  const db = await getDb();
  if (!db || zonas.length === 0) return [];
  const rows = await db
    .select()
    .from(electoralZones)
    .where(and(
      eq(electoralZones.uf, uf),
      sql`${electoralZones.numeroZona} IN (${sql.join(zonas.map(z => sql`${z}`), sql`, `)})`
    ));
  return rows;
}

// ─── Perfil Unificado de Candidato ──────────────────────────────────────────

/**
 * Busca os dados do candidato no banco local (sequencial, CPF, votos, cargo, UF, ano).
 * Retorna também todas as eleições desse candidato no banco (via CPF).
 */
export async function getCandidateLocalData(params: {
  candidatoSequencial: string;
  ano: number;
  turno: number;
}) {
  const db = await getDb();
  if (!db) return null;

  // Buscar o registro principal do candidato
  const rows = await db
    .select({
      candidatoSequencial: candidateResults.candidatoSequencial,
      candidatoNome: candidateResults.candidatoNome,
      candidatoNomeUrna: candidateResults.candidatoNomeUrna,
      candidatoNumero: candidateResults.candidatoNumero,
      cpf: candidateResults.cpf,
      partidoSigla: candidateResults.partidoSigla,
      uf: candidateResults.uf,
      cargo: candidateResults.cargo,
      ano: candidateResults.ano,
      turno: candidateResults.turno,
      totalVotos: candidateResults.totalVotos,
      situacao: candidateResults.situacao,
      eleito: candidateResults.eleito,
    })
    .from(candidateResults)
    .where(
      and(
        eq(candidateResults.candidatoSequencial, params.candidatoSequencial),
        eq(candidateResults.ano, params.ano),
        eq(candidateResults.turno, params.turno),
      )
    )
    .limit(1);

  if (rows.length === 0) return null;
  const main = rows[0];

  // Se tiver CPF, buscar todas as eleições do mesmo candidato no banco
  let allElections: typeof rows = [];
  if (main.cpf) {
    allElections = await db
      .select({
        candidatoSequencial: candidateResults.candidatoSequencial,
        candidatoNome: candidateResults.candidatoNome,
        candidatoNomeUrna: candidateResults.candidatoNomeUrna,
        candidatoNumero: candidateResults.candidatoNumero,
        cpf: candidateResults.cpf,
        partidoSigla: candidateResults.partidoSigla,
        uf: candidateResults.uf,
        cargo: candidateResults.cargo,
        ano: candidateResults.ano,
        turno: candidateResults.turno,
        totalVotos: candidateResults.totalVotos,
        situacao: candidateResults.situacao,
        eleito: candidateResults.eleito,
      })
      .from(candidateResults)
      .where(
        and(
          eq(candidateResults.cpf, main.cpf),
          eq(candidateResults.turno, 1), // apenas 1º turno para evitar duplicatas
        )
      )
      .orderBy(desc(candidateResults.ano));
  }

  // Buscar código do município para eleições municipais (necessário para a API DivulgaCandContas)
  const zoneRow = await db
    .select({ codigoMunicipio: candidateZoneResults.codigoMunicipio })
    .from(candidateZoneResults)
    .where(
      and(
        eq(candidateZoneResults.candidatoSequencial, params.candidatoSequencial),
        eq(candidateZoneResults.ano, params.ano),
      )
    )
    .limit(1);

  return {
    main,
    allElections,
    codigoMunicipio: zoneRow[0]?.codigoMunicipio ?? null,
  };
}
