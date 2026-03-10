import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  getAllParties,
  getCandidatesByUf,
  getCandidateZoneByMunicipality,
  getCandidateZoneDetail,
  getElectionContextByMunicipality,
  getElectionContextSummary,
  getElectionSummary,
  getMapDataByUf,
  getMunicipalitiesByUf,
  getMunicipalitiesWithData,
  getPartyComparison,
  getRankingByUf,
  getResultsByMunicipality,
  getResultsByUf,
  getResultsByZone,
  getTemporalEvolution,
  countEleitosByParty,
  searchCandidates,
  searchMunicipalities,
  getZoneInfoBatch,
  getCandidateLocalData,
} from "./db";
import { getCandidateProfile } from "./divulgacand";
import { seedDatabase } from "./seed";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Partidos ─────────────────────────────────────────────────────────────
  parties: router({
    list: publicProcedure.query(() => getAllParties()),
  }),

  // ─── Municípios ───────────────────────────────────────────────────────────
  municipalities: router({
    byUf: publicProcedure
      .input(z.object({ uf: z.string().length(2) }))
      .query(({ input }) => getMunicipalitiesByUf(input.uf)),

    search: publicProcedure
      .input(z.object({ query: z.string().min(2), uf: z.string().length(2).optional() }))
      .query(({ input }) => searchMunicipalities(input.query, input.uf)),
  }),

  // ─── Mapa ─────────────────────────────────────────────────────────────────
  map: router({
    byUf: publicProcedure
      .input(z.object({
        ano: z.number().int(),
        turno: z.number().int().min(1).max(2),
        cargo: z.string(),
        partidoSigla: z.string().optional(),
      }))
      .query(({ input }) => getMapDataByUf(input)),

    resultsByUf: publicProcedure
      .input(z.object({
        ano: z.number().int().optional(),
        turno: z.number().int().optional(),
        cargo: z.string().optional(),
        partidoSigla: z.string().optional(),
        uf: z.string().optional(),
      }))
      .query(({ input }) => getResultsByUf(input)),

    resultsByMunicipality: publicProcedure
      .input(z.object({
        ano: z.number().int().optional(),
        turno: z.number().int().optional(),
        cargo: z.string().optional(),
        partidoSigla: z.string().optional(),
        uf: z.string().optional(),
        codigoMunicipio: z.string().optional(),
        limit: z.number().int().max(500).optional(),
      }))
      .query(({ input }) => getResultsByMunicipality(input)),

    resultsByZone: publicProcedure
      .input(z.object({
        ano: z.number().int().optional(),
        turno: z.number().int().optional(),
        cargo: z.string().optional(),
        partidoSigla: z.string().optional(),
        uf: z.string().optional(),
        codigoMunicipio: z.string().optional(),
      }))
      .query(({ input }) => getResultsByZone(input)),
  }),

  // ─── Análises ─────────────────────────────────────────────────────────────
  analytics: router({
    summary: publicProcedure
      .input(z.object({
        ano: z.number().int().optional(),
        turno: z.number().int().optional(),
        cargo: z.string().optional(),
        uf: z.string().optional(),
      }))
      .query(({ input }) => getElectionSummary(input)),

    ranking: publicProcedure
      .input(z.object({
        ano: z.number().int(),
        turno: z.number().int(),
        cargo: z.string(),
        uf: z.string(),
        limit: z.number().int().max(50).optional(),
      }))
      .query(({ input }) => getRankingByUf(input)),

    temporalEvolution: publicProcedure
      .input(z.object({
        cargo: z.string(),
        partidoSigla: z.string().optional(),
        uf: z.string().optional(),
      }))
      .query(({ input }) => getTemporalEvolution(input)),

    partyComparison: publicProcedure
      .input(z.object({
        ano: z.number().int(),
        turno: z.number().int(),
        cargo: z.string(),
        uf: z.string().optional(),
      }))
      .query(({ input }) => getPartyComparison(input)),
  }),

  // ─── Candidatos ─────────────────────────────────────────────────────────────
  candidates: router({
    search: publicProcedure
      .input(z.object({
        query: z.string().min(2),
        ano: z.number().int().optional(),
        cargo: z.string().optional(),
        uf: z.string().optional(),
        partidoSigla: z.string().optional(),
      }))
      .query(({ input }) => searchCandidates(input.query, input)),

    // Drill-down: candidatos por partido/UF/cargo/ano
    byUf: publicProcedure
      .input(z.object({
        ano: z.number().int(),
        turno: z.number().int().min(1).max(2),
        cargo: z.string(),
        uf: z.string().length(2),
        partidoSigla: z.string().optional(),
        limit: z.number().int().max(200).optional(),
      }))
      .query(({ input }) => getCandidatesByUf(input)),

    // Detalhe por zona eleitoral de um candidato
    zoneDetail: publicProcedure
      .input(z.object({
        candidatoSequencial: z.string(),
        ano: z.number().int(),
        turno: z.number().int().min(1).max(2),
        uf: z.string().length(2).optional(),
      }))
      .query(({ input }) => getCandidateZoneDetail(input)),

    // Detalhe por município de um candidato (agrupado)
    zoneByMunicipality: publicProcedure
      .input(z.object({
        candidatoSequencial: z.string(),
        ano: z.number().int(),
        turno: z.number().int().min(1).max(2),
        uf: z.string().length(2).optional(),
      }))
      .query(({ input }) => getCandidateZoneByMunicipality(input)),

    // Resumo eleitoral contextual: todos os candidatos (todos os partidos) para UF/cargo/ano
    contextSummary: publicProcedure
      .input(z.object({
        ano: z.number().int(),
        turno: z.number().int().min(1).max(2),
        cargo: z.string(),
        uf: z.string().length(2),
        codigoMunicipio: z.string().optional(),
        partidoSigla: z.string().optional(),
        limit: z.number().int().max(1000).optional(),
      }))
      .query(({ input }) => getElectionContextSummary(input)),

    // Resumo eleitoral por município: todos os candidatos de um município específico
    contextByMunicipality: publicProcedure
      .input(z.object({
        ano: z.number().int(),
        turno: z.number().int().min(1).max(2),
        cargo: z.string(),
        uf: z.string().length(2),
        nomeMunicipio: z.string().min(1),
        partidoSigla: z.string().optional(),
        limit: z.number().int().max(1000).optional(),
      }))
      .query(({ input }) => getElectionContextByMunicipality(input)),

    // Lista municípios com dados eleitorais para um UF/ano/cargo
    municipalitiesWithData: publicProcedure
      .input(z.object({
        ano: z.number().int(),
        cargo: z.string(),
        uf: z.string().length(2),
      }))
      .query(({ input }) => getMunicipalitiesWithData(input)),

    // Informações de zonas eleitorais (bairro/localidade)
    zoneInfo: publicProcedure
      .input(z.object({
        uf: z.string().length(2),
        zonas: z.array(z.string()),
      }))
      .query(({ input }) => getZoneInfoBatch(input.uf, input.zonas)),
    // Contagem de candidatos eleitos
    countEleitos: publicProcedure
      .input(z.object({
        ano: z.number().int(),
        turno: z.number().int().min(1).max(2),
        cargo: z.string(),
        partidoSigla: z.string().optional(),
        uf: z.string().optional(),
      }))
      .query(({ input }) => countEleitosByParty(input)),

    // Perfil unificado de candidato: dados locais + DivulgaCandContas
    getProfile: publicProcedure
      .input(z.object({
        candidatoSequencial: z.string(),
        ano: z.number().int(),
        turno: z.number().int().min(1).max(2),
      }))
      .query(async ({ input }) => {
        // 1. Buscar dados locais (CPF, votos, histórico no banco)
        const local = await getCandidateLocalData(input);
        if (!local) return null;

        const { main, allElections, codigoMunicipio } = local;

        // 2. Buscar dados do DivulgaCandContas (foto, gasto, histórico completo)
        let divulga = null;
        try {
          divulga = await getCandidateProfile({
            sequencial: main.candidatoSequencial,
            ano: main.ano,
            cargo: main.cargo,
            uf: main.uf,
            codigoMunicipio,
          });
        } catch (err) {
          console.warn("[DivulgaCand] Falha ao buscar perfil:", err);
        }

        // 3. Calcular custo por voto para cada eleição com dados locais
        // Cruzar histórico do DivulgaCandContas com votos do banco
        const historico = (divulga?.eleicoesAnteriores ?? []).map((e) => {
          // Encontrar votos no banco para essa eleição
          const localElection = allElections.find(
            (le) => le.ano === e.nrAno && le.cargo.toUpperCase() === e.cargo?.toUpperCase()
          );
          const votos = localElection?.totalVotos ?? null;

          // Gasto total = 1T + 2T (quando disponível)
          // Para eleições anteriores, o DivulgaCandContas não retorna gasto diretamente
          // O gasto só está disponível para a eleição atual
          return {
            ano: e.nrAno,
            cargo: e.cargo,
            partido: e.partido,
            uf: e.sgUe,
            situacao: e.situacaoTotalizacao,
            votos,
            gastoCampanha: null as number | null, // só disponível via endpoint individual
            custoPorVoto: null as number | null,
            txLink: e.txLink,
          };
        });

        // Custo por voto da eleição atual
        const gastoTotal = (divulga?.gastoCampanha1T ?? 0) + (divulga?.gastoCampanha2T ?? 0);
        const custoPorVotoAtual =
          gastoTotal > 0 && main.totalVotos > 0
            ? gastoTotal / main.totalVotos
            : null;

        // Gênero e orientação (só se publicavel)
        const genero = divulga?.infoComplementar?.generoPublicavel
          ? divulga.infoComplementar.identidadeGenero
          : (divulga?.descricaoSexo ?? null);
        const orientacao = divulga?.infoComplementar?.orientacaoSexualPublicavel
          ? divulga.infoComplementar.orientacaoSexual
          : null;

        return {
          // Dados locais
          candidatoSequencial: main.candidatoSequencial,
          candidatoNome: main.candidatoNome,
          candidatoNomeUrna: main.candidatoNomeUrna,
          candidatoNumero: main.candidatoNumero,
          cpf: main.cpf,
          partidoSigla: main.partidoSigla,
          uf: main.uf,
          cargo: main.cargo,
          ano: main.ano,
          turno: main.turno,
          totalVotos: main.totalVotos,
          situacao: main.situacao,
          eleito: main.eleito,
          // Dados DivulgaCandContas
          fotoUrl: divulga?.fotoUrl ?? null,
          fotoPublicavel: divulga?.fotoUrlPublicavel ?? false,
          descricaoSituacaoCandidato: divulga?.descricaoSituacaoCandidato ?? null,
          isCandidatoInapto: divulga?.isCandidatoInapto ?? false,
          gastoCampanha1T: divulga?.gastoCampanha1T ?? null,
          gastoCampanha2T: divulga?.gastoCampanha2T ?? null,
          gastoTotal: gastoTotal > 0 ? gastoTotal : null,
          custoPorVoto: custoPorVotoAtual,
          genero,
          orientacao,
          nomeColigacao: divulga?.nomeColigacao ?? null,
          // Histórico de eleições
          historico,
          // Eleições no banco local (com votos)
          eleicoesNoBanco: allElections.map((e) => ({
            ano: e.ano,
            cargo: e.cargo,
            partido: e.partidoSigla,
            uf: e.uf,
            totalVotos: e.totalVotos,
            eleito: e.eleito,
            situacao: e.situacao,
          })),
        };
      }),
  }),

  // ─── Seed ─────────────────────────────────────────────────────────────────
  seed: router({
    run: publicProcedure.mutation(() => seedDatabase()),
  }),
});

export type AppRouter = typeof appRouter;
