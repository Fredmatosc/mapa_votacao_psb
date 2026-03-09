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
