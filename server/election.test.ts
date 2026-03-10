import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("returns success and clears cookie", async () => {
    const cleared: string[] = [];
    const ctx: TrpcContext = {
      user: {
        id: 1, openId: "test", email: "t@t.com", name: "Test",
        loginMethod: "manus", role: "user",
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: (name: string) => cleared.push(name) } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(cleared.length).toBe(1);
  });
});

describe("parties.list", () => {
  it("returns an array (may be empty if DB not seeded)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.parties.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("map.byUf", () => {
  it("accepts valid filter parameters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.map.byUf({
      ano: 2022,
      turno: 1,
      cargo: "DEPUTADO FEDERAL",
      partidoSigla: "PSB",
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects invalid turno", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.map.byUf({ ano: 2022, turno: 3, cargo: "DEPUTADO FEDERAL" })
    ).rejects.toThrow();
  });
});

describe("map.resultsByUf", () => {
  it("returns array for valid filters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.map.resultsByUf({
      ano: 2022,
      turno: 1,
      cargo: "DEPUTADO FEDERAL",
      partidoSigla: "PSB",
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts empty filters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.map.resultsByUf({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("analytics.partyComparison", () => {
  it("returns array for valid input", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analytics.partyComparison({
      ano: 2022,
      turno: 1,
      cargo: "DEPUTADO FEDERAL",
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("analytics.temporalEvolution", () => {
  it("returns array for valid cargo", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analytics.temporalEvolution({
      cargo: "DEPUTADO FEDERAL",
      partidoSigla: "PSB",
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("municipalities.search", () => {
  it("requires at least 2 characters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.municipalities.search({ query: "A" })
    ).rejects.toThrow();
  });

  it("accepts valid query", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.municipalities.search({ query: "São Paulo" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("candidates.search", () => {
  it("requires at least 2 characters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.candidates.search({ query: "A" })
    ).rejects.toThrow();
  });

  it("accepts valid query with filters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.candidates.search({
      query: "Marina",
      ano: 2010,
      cargo: "PRESIDENTE",
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("candidates.byUf (drill-down)", () => {
  it("returns array for valid UF/ano/cargo", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.candidates.byUf({
      uf: "SP",
      ano: 2020,
      turno: 1,
      cargo: "VEREADOR",
      partidoSigla: "PSB",
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects invalid UF length", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.candidates.byUf({ uf: "SAO", ano: 2022, turno: 1, cargo: "DEPUTADO FEDERAL" })
    ).rejects.toThrow();
  });

  it("rejects invalid turno", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.candidates.byUf({ uf: "SP", ano: 2022, turno: 3, cargo: "DEPUTADO FEDERAL" })
    ).rejects.toThrow();
  });
});

describe("candidates.contextSummary", () => {
  it("returns object with candidates array and summary", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.candidates.contextSummary({
      uf: "CE",
      ano: 2020,
      turno: 1,
      cargo: "VEREADOR",
    });
    expect(result).toHaveProperty("candidates");
    expect(result).toHaveProperty("summary");
    expect(Array.isArray(result.candidates)).toBe(true);
  });
});

describe("candidates.municipalitiesWithData", () => {
  it("returns array for valid UF/ano/cargo", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.candidates.municipalitiesWithData({
      uf: "CE",
      ano: 2020,
      cargo: "VEREADOR",
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("candidates.countEleitos", () => {
  it("returns object with total field", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.candidates.countEleitos({
      ano: 2022,
      turno: 1,
      cargo: "DEPUTADO FEDERAL",
      partidoSigla: "PSB",
    });
    expect(result).toHaveProperty("total");
    expect(typeof result.total).toBe("number");
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it("returns 0 for non-existent party/year combination", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.candidates.countEleitos({
      ano: 2010,
      turno: 1,
      cargo: "DEPUTADO FEDERAL",
      partidoSigla: "XYZABC",
    });
    expect(result.total).toBe(0);
  });

  it("rejects invalid turno", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.candidates.countEleitos({ ano: 2022, turno: 5, cargo: "DEPUTADO FEDERAL" })
    ).rejects.toThrow();
  });
});

describe("candidates.zoneByMunicipality", () => {
  it("returns array for valid candidatoSequencial", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.candidates.zoneByMunicipality({
      candidatoSequencial: "000000000001",
      ano: 2022,
      turno: 1,
      uf: "SP",
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects invalid UF length", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.candidates.zoneByMunicipality({
        candidatoSequencial: "000000000001",
        ano: 2022,
        turno: 1,
        uf: "SAO",
      })
    ).rejects.toThrow();
  });
});

describe("candidates.zoneDetail", () => {
  it("returns array for valid candidatoSequencial", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.candidates.zoneDetail({
      candidatoSequencial: "000000000001",
      ano: 2022,
      turno: 1,
      uf: "SP",
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects invalid turno", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.candidates.zoneDetail({
        candidatoSequencial: "000000000001",
        ano: 2022,
        turno: 5,
        uf: "SP",
      })
    ).rejects.toThrow();
  });
});

describe("candidates.contextByMunicipality", () => {
  it("returns object with candidates array and summary", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.candidates.contextByMunicipality({
      uf: "SP",
      ano: 2020,
      turno: 1,
      cargo: "PREFEITO",
      nomeMunicipio: "SÃO PAULO",
    });
    expect(result).toHaveProperty("candidates");
    expect(result).toHaveProperty("summary");
    expect(Array.isArray(result.candidates)).toBe(true);
  });

  it("rejects empty nomeMunicipio", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.candidates.contextByMunicipality({
        uf: "SP",
        ano: 2020,
        turno: 1,
        cargo: "PREFEITO",
        nomeMunicipio: "",
      })
    ).rejects.toThrow();
  });
});

describe("candidates.zoneInfo", () => {
  it("returns array for valid UF and zonas", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.candidates.zoneInfo({
      uf: "SP",
      zonas: ["001", "002"],
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns empty array for empty zonas", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.candidates.zoneInfo({
      uf: "SP",
      zonas: [],
    });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});
