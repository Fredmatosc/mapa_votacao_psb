import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  index,
  bigint,
  smallint,
  tinyint,
  boolean,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Partidos políticos
export const parties = mysqlTable("parties", {
  id: int("id").autoincrement().primaryKey(),
  sigla: varchar("sigla", { length: 20 }).notNull().unique(),
  nome: varchar("nome", { length: 200 }).notNull(),
  numero: smallint("numero"),
  cor: varchar("cor", { length: 7 }).default("#888888"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Party = typeof parties.$inferSelect;

// Municípios com código IBGE
export const municipalities = mysqlTable("municipalities", {
  id: int("id").autoincrement().primaryKey(),
  codigoIbge: varchar("codigoIbge", { length: 10 }).notNull().unique(),
  nome: varchar("nome", { length: 200 }).notNull(),
  uf: varchar("uf", { length: 2 }).notNull(),
  regiao: varchar("regiao", { length: 20 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
}, (t) => [
  index("idx_municipalities_uf").on(t.uf),
]);

export type Municipality = typeof municipalities.$inferSelect;

// Candidatos (dados cadastrais do TSE)
export const candidates = mysqlTable("candidates", {
  id: int("id").autoincrement().primaryKey(),
  sequencial: varchar("sequencial", { length: 20 }),
  nome: varchar("nome", { length: 200 }).notNull(),
  nomeUrna: varchar("nomeUrna", { length: 100 }),
  numero: varchar("numero", { length: 10 }),
  partidoSigla: varchar("partidoSigla", { length: 20 }),
  uf: varchar("uf", { length: 2 }),
  cargo: varchar("cargo", { length: 50 }),
  ano: smallint("ano").notNull(),
  turno: tinyint("turno").default(1),
  situacao: varchar("situacao", { length: 100 }),
  eleito: boolean("eleito").default(false),
  genero: varchar("genero", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_candidates_partido").on(t.partidoSigla),
  index("idx_candidates_uf_ano").on(t.uf, t.ano),
  index("idx_candidates_nome").on(t.nome),
  index("idx_candidates_seq").on(t.sequencial),
]);

export type Candidate = typeof candidates.$inferSelect;

// Resultados por candidato por UF (votos totais na UF)
// Esta é a tabela principal para drill-down: partido → candidatos
export const candidateResults = mysqlTable("candidate_results", {
  id: int("id").autoincrement().primaryKey(),
  candidatoSequencial: varchar("candidatoSequencial", { length: 20 }).notNull(),
  candidatoNome: varchar("candidatoNome", { length: 200 }).notNull(),
  candidatoNomeUrna: varchar("candidatoNomeUrna", { length: 100 }),
  candidatoNumero: varchar("candidatoNumero", { length: 10 }),
  cpf: varchar("cpf", { length: 11 }), // CPF do candidato (chave de ligação entre eleições)
  partidoSigla: varchar("partidoSigla", { length: 20 }).notNull(),
  uf: varchar("uf", { length: 2 }).notNull(),
  cargo: varchar("cargo", { length: 50 }).notNull(),
  ano: smallint("ano").notNull(),
  turno: tinyint("turno").notNull().default(1),
  totalVotos: bigint("totalVotos", { mode: "number" }).notNull().default(0),
  totalVotosPartido: bigint("totalVotosPartido", { mode: "number" }).default(0),
  percentualSobrePartido: decimal("percentualSobrePartido", { precision: 8, scale: 4 }),
  percentualSobreValidos: decimal("percentualSobreValidos", { precision: 8, scale: 4 }),
  situacao: varchar("situacao", { length: 100 }),
  eleito: boolean("eleito").default(false),
  receitaTotal: decimal("receitaTotal", { precision: 15, scale: 2 }),
  despesaTotal: decimal("despesaTotal", { precision: 15, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_cand_results_partido_uf").on(t.partidoSigla, t.uf),
  index("idx_cand_results_ano_cargo").on(t.ano, t.cargo),
  index("idx_cand_results_seq").on(t.candidatoSequencial),
  index("idx_cand_results_uf_ano").on(t.uf, t.ano),
]);

export type CandidateResult = typeof candidateResults.$inferSelect;

// Votos por candidato por zona eleitoral (detalhamento máximo)
export const candidateZoneResults = mysqlTable("candidate_zone_results", {
  id: int("id").autoincrement().primaryKey(),
  candidatoSequencial: varchar("candidatoSequencial", { length: 20 }).notNull(),
  candidatoNome: varchar("candidatoNome", { length: 200 }).notNull(),
  candidatoNomeUrna: varchar("candidatoNomeUrna", { length: 100 }),
  partidoSigla: varchar("partidoSigla", { length: 20 }).notNull(),
  uf: varchar("uf", { length: 2 }).notNull(),
  codigoMunicipio: varchar("codigoMunicipio", { length: 10 }),
  nomeMunicipio: varchar("nomeMunicipio", { length: 200 }),
  numeroZona: varchar("numeroZona", { length: 10 }).notNull(),
  cargo: varchar("cargo", { length: 50 }).notNull(),
  ano: smallint("ano").notNull(),
  turno: tinyint("turno").notNull().default(1),
  totalVotos: bigint("totalVotos", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_zone_cand_seq").on(t.candidatoSequencial),
  index("idx_zone_cand_uf_ano").on(t.uf, t.ano),
  index("idx_zone_cand_partido").on(t.partidoSigla),
  index("idx_zone_cand_municipio").on(t.codigoMunicipio),
]);

export type CandidateZoneResult = typeof candidateZoneResults.$inferSelect;

// Resultados eleitorais agregados por UF (por partido - para o mapa coroplético)
export const electionResultsByUf = mysqlTable("election_results_by_uf", {
  id: int("id").autoincrement().primaryKey(),
  ano: smallint("ano").notNull(),
  turno: tinyint("turno").notNull(),
  uf: varchar("uf", { length: 2 }).notNull(),
  cargo: varchar("cargo", { length: 50 }).notNull(),
  partidoSigla: varchar("partidoSigla", { length: 20 }).notNull(),
  totalVotos: bigint("totalVotos", { mode: "number" }).notNull().default(0),
  totalVotosBranco: bigint("totalVotosBranco", { mode: "number" }).default(0),
  totalVotosNulos: bigint("totalVotosNulos", { mode: "number" }).default(0),
  totalVotosValidos: bigint("totalVotosValidos", { mode: "number" }).default(0),
  totalComparecimento: bigint("totalComparecimento", { mode: "number" }).default(0),
  totalAbstencoes: bigint("totalAbstencoes", { mode: "number" }).default(0),
  percentualVotos: decimal("percentualVotos", { precision: 8, scale: 4 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_uf_results_ano_turno").on(t.ano, t.turno),
  index("idx_uf_results_uf").on(t.uf),
  index("idx_uf_results_partido").on(t.partidoSigla),
  index("idx_uf_results_cargo").on(t.cargo),
]);

export type ElectionResultByUf = typeof electionResultsByUf.$inferSelect;

// Resultados eleitorais agregados por município
export const electionResultsByMunicipality = mysqlTable("election_results_by_municipality", {
  id: int("id").autoincrement().primaryKey(),
  ano: smallint("ano").notNull(),
  turno: tinyint("turno").notNull(),
  uf: varchar("uf", { length: 2 }).notNull(),
  codigoMunicipio: varchar("codigoMunicipio", { length: 10 }).notNull(),
  nomeMunicipio: varchar("nomeMunicipio", { length: 200 }).notNull(),
  cargo: varchar("cargo", { length: 50 }).notNull(),
  partidoSigla: varchar("partidoSigla", { length: 20 }).notNull(),
  totalVotos: bigint("totalVotos", { mode: "number" }).notNull().default(0),
  totalVotosBranco: bigint("totalVotosBranco", { mode: "number" }).default(0),
  totalVotosNulos: bigint("totalVotosNulos", { mode: "number" }).default(0),
  totalVotosValidos: bigint("totalVotosValidos", { mode: "number" }).default(0),
  percentualVotos: decimal("percentualVotos", { precision: 8, scale: 4 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_mun_results_ano_turno").on(t.ano, t.turno),
  index("idx_mun_results_uf").on(t.uf),
  index("idx_mun_results_partido").on(t.partidoSigla),
  index("idx_mun_results_cargo").on(t.cargo),
  index("idx_mun_results_municipio").on(t.codigoMunicipio),
]);

export type ElectionResultByMunicipality = typeof electionResultsByMunicipality.$inferSelect;

// Resultados eleitorais agregados por zona eleitoral (por partido)
export const electionResultsByZone = mysqlTable("election_results_by_zone", {
  id: int("id").autoincrement().primaryKey(),
  ano: smallint("ano").notNull(),
  turno: tinyint("turno").notNull(),
  uf: varchar("uf", { length: 2 }).notNull(),
  codigoMunicipio: varchar("codigoMunicipio", { length: 10 }).notNull(),
  nomeMunicipio: varchar("nomeMunicipio", { length: 200 }),
  numeroZona: varchar("numeroZona", { length: 10 }).notNull(),
  cargo: varchar("cargo", { length: 50 }).notNull(),
  partidoSigla: varchar("partidoSigla", { length: 20 }).notNull(),
  candidatoNome: varchar("candidatoNome", { length: 200 }),
  totalVotos: bigint("totalVotos", { mode: "number" }).notNull().default(0),
  percentualVotos: decimal("percentualVotos", { precision: 8, scale: 4 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_zone_results_ano_uf").on(t.ano, t.uf),
  index("idx_zone_results_partido").on(t.partidoSigla),
]);

export type ElectionResultByZone = typeof electionResultsByZone.$inferSelect;

// Sumário geral por eleição (para KPIs)
export const electionSummary = mysqlTable("election_summary", {
  id: int("id").autoincrement().primaryKey(),
  ano: smallint("ano").notNull(),
  turno: tinyint("turno").notNull(),
  uf: varchar("uf", { length: 2 }),
  cargo: varchar("cargo", { length: 50 }).notNull(),
  totalEleitores: bigint("totalEleitores", { mode: "number" }).default(0),
  totalComparecimento: bigint("totalComparecimento", { mode: "number" }).default(0),
  totalAbstencoes: bigint("totalAbstencoes", { mode: "number" }).default(0),
  totalVotosBranco: bigint("totalVotosBranco", { mode: "number" }).default(0),
  totalVotosNulos: bigint("totalVotosNulos", { mode: "number" }).default(0),
  totalVotosValidos: bigint("totalVotosValidos", { mode: "number" }).default(0),
  percentualComparecimento: decimal("percentualComparecimento", { precision: 8, scale: 4 }),
  percentualAbstencao: decimal("percentualAbstencao", { precision: 8, scale: 4 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_summary_ano_turno").on(t.ano, t.turno),
  index("idx_summary_uf").on(t.uf),
]);

export type ElectionSummary = typeof electionSummary.$inferSelect;

// Zonas eleitorais com endereço e bairro (georreferenciamento)
export const electoralZones = mysqlTable("electoral_zones", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: varchar("zoneId", { length: 10 }).notNull(), // ex: '07-0001'
  uf: varchar("uf", { length: 2 }).notNull(),
  numeroZona: varchar("numeroZona", { length: 10 }).notNull(), // ex: '1'
  nomeMunicipio: varchar("nomeMunicipio", { length: 200 }),
  bairro: varchar("bairro", { length: 200 }),
  endereco: text("endereco"),
  cep: varchar("cep", { length: 10 }),
  municipioId: varchar("municipioId", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_electoral_zones_uf_zona").on(t.uf, t.numeroZona),
  uniqueIndex("idx_electoral_zones_zone_id").on(t.zoneId),
]);

export type ElectoralZone = typeof electoralZones.$inferSelect;

// Votos por candidato por local de votação (escola/posto) - granularidade máxima
export const candidateLocalResults = mysqlTable("candidate_local_results", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  candidateResultId: int("candidateResultId").notNull(),
  ano: int("ano").notNull(),
  turno: int("turno").notNull().default(1),
  cargo: varchar("cargo", { length: 100 }).notNull(),
  uf: varchar("uf", { length: 2 }).notNull(),
  codigoMunicipio: varchar("codigoMunicipio", { length: 10 }),
  zonaEleitoral: varchar("zonaEleitoral", { length: 10 }),
  nrLocalVotacao: varchar("nrLocalVotacao", { length: 20 }),
  nmLocalVotacao: varchar("nmLocalVotacao", { length: 200 }),
  enderecoLocal: varchar("enderecoLocal", { length: 300 }),
  totalVotos: bigint("totalVotos", { mode: "number" }).notNull().default(0),
}, (t) => [
  index("idx_local_results_ano_uf").on(t.ano, t.uf),
  index("idx_local_results_municipio").on(t.codigoMunicipio),
  index("idx_local_results_zona").on(t.zonaEleitoral),
  index("idx_local_results_candidate").on(t.candidateResultId),
]);

export type CandidateLocalResult = typeof candidateLocalResults.$inferSelect;
