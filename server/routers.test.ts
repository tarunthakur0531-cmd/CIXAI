import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(user?: Partial<AuthenticatedUser>): TrpcContext {
  const defaults: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user: { ...defaults, ...user } as AuthenticatedUser,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("appRouter", () => {
  describe("auth", () => {
    it("auth.me returns the authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toBeDefined();
      expect(result!.email).toBe("test@example.com");
      expect(result!.name).toBe("Test User");
    });

    it("auth.me returns null when unauthenticated", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toBeNull();
    });

    it("auth.logout clears the session cookie", async () => {
      let clearedName = "";
      const ctx: TrpcContext = {
        ...createAuthContext(),
        res: {
          clearCookie: (name: string) => {
            clearedName = name;
          },
        } as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();
      expect(result).toEqual({ success: true });
      expect(clearedName).toBe(COOKIE_NAME);
    });
  });

  describe("system", () => {
    it("system.health returns ok", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.system.health({ timestamp: Date.now() });
      expect(result).toEqual({ ok: true });
    });
  });

  describe("protected routes reject unauthenticated users", () => {
    const protectedRoutes = [
      "memories.list",
      "memories.search",
      "memories.create",
      "tasks.list",
      "tasks.create",
      "agents.list",
      "agents.create",
      "insights.list",
      "insights.generate",
      "chat.sessions",
      "privacy.stats",

      "models.list",
    ];

    it.each(protectedRoutes)("protected route %s throws UNAUTHORIZED when user is null", async (route) => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      // Navigate to the nested procedure
      const parts = route.split(".");
      let proc: any = caller;
      for (const part of parts) {
        proc = proc[part];
      }

      // Call with no input (for queries) or empty input (for mutations)
      let error: any;
      try {
        if (route.includes("memories.create") || route.includes("tasks.create") || route.includes("agents.create")) {
          await proc({ title: "test", content: "test" });
        } else if (route.includes("memories.search")) {
          await proc({ query: "test" });
        } else {
          await proc();
        }
      } catch (e: any) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("memories router", () => {
    it("memories.search accepts a query string", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Should not throw with valid query
      const result = await caller.memories.search({ query: "test" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("memories.listByCategory accepts a category", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Should not throw with valid category
      const result = await caller.memories.listByCategory({ category: "note" });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("tasks router", () => {
    it("tasks.list accepts optional status filter", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Should not throw with valid status
      const result = await caller.tasks.list({ status: "pending" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("tasks.list without input returns all tasks", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tasks.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("agents router", () => {
    it("agents.create requires a name and type", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      let error: any;
      try {
        await caller.agents.create({ name: "", type: "research" });
      } catch (e: any) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe("BAD_REQUEST");
    });

    it("agents.create with invalid type is rejected", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      let error: any;
      try {
        await caller.agents.create({ name: "Test", type: "invalid" });
      } catch (e: any) {
        error = e;
      }

      expect(error).toBeDefined();
    });
  });

  describe("privacy router", () => {
    it("privacy.stats returns data overview", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.privacy.stats();
      expect(result).toBeDefined();
      expect(typeof result.totalMemories).toBe("number");
      expect(typeof result.totalTasks).toBe("number");
      expect(typeof result.chatSessions).toBe("number");
      expect(typeof result.totalEvents).toBe("number");
    });
  });

  describe("insights router", () => {
    it("insights.list returns an array", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.insights.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("chat router", () => {
    it("chat.sessions returns an array", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.sessions();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("graph router", () => {
    it("graph.get returns nodes and edges", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.graph.get();
      expect(result).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(Array.isArray(result.edges)).toBe(true);
    });
  });
});
