import { and, desc, eq, ilike, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, candidates, electionResultsByMunicipality, electionResultsByUf, electionResultsByZone, electionSummary, municipalities, parties, users } from "../drizzle/schema";
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
