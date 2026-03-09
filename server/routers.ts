import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  getAllParties,
  getElectionSummary,
  getMapDataByUf,
  getMunicipalitiesByUf,
  getPartyComparison,
  getRankingByUf,
  getResultsByMunicipality,
  getResultsByUf,
  getResultsByZone,
  getTemporalEvolution,
  searchCandidates,
  searchMunicipalities,
} from "./db";
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

  // ─── Candidatos ───────────────────────────────────────────────────────────
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
  }),

  // ─── Seed ─────────────────────────────────────────────────────────────────
  seed: router({
    run: publicProcedure.mutation(() => seedDatabase()),
  }),
});

export type AppRouter = typeof appRouter;
