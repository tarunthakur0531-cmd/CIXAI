import { eq, and, desc, asc, sql, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, memories, tasks, agents, events, insights, chatSessions, chatMessages } from "../drizzle/schema";
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
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach(field => {
      const value = user[field];
      if (value === undefined) return;
      values[field] = value ?? null;
      updateSet[field] = values[field];
    });
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---- Memories ----
export async function getUserMemories(userId: number, options?: { category?: string; search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(memories.userId, userId)];
  if (options?.category) conditions.push(eq(memories.category, options.category as any));
  if (options?.search) {
    const searchTerm = `%${options.search}%`;
    conditions.push(
      or(like(memories.title, searchTerm), like(memories.content, searchTerm), like(memories.tags, searchTerm))!
    );
  }
  const rows = await db.select()
    .from(memories)
    .where(and(...conditions))
    .orderBy(desc(memories.createdAt))
    .limit(options?.limit ?? 50)
    .offset(options?.offset ?? 0);
  return rows;
}

export async function getMemoryById(id: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(memories).where(and(eq(memories.id, id), eq(memories.userId, userId))).limit(1);
  return rows[0];
}

export async function createMemory(data: { id: string; userId: number; content: string; title?: string; category?: 'note' | 'idea' | 'decision' | 'fact' | 'observation' | 'project' | 'meeting' | 'document' | 'learning' | 'research'; tags?: string; source?: string; aiModel?: string; confidenceScore?: number; project?: string; people?: string; createdAt: number; updatedAt: number }) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(memories).values(data);
  return result;
}

export async function updateMemory(id: string, userId: number, data: Partial<{ content: string; title: string; category: 'note' | 'idea' | 'decision' | 'fact' | 'observation' | 'project' | 'meeting' | 'document' | 'learning' | 'research'; tags: string; project: string; people: string; updatedAt: number }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(memories).set({ ...data, updatedAt: data.updatedAt ?? Date.now() }).where(and(eq(memories.id, id), eq(memories.userId, userId)));
}

export async function deleteMemory(id: string, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(memories).where(and(eq(memories.id, id), eq(memories.userId, userId)));
}

export async function getMemoryStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, byCategory: {} as Record<string, number>, recent24h: 0, last7d: 0 };
  const all = await db.select().from(memories).where(eq(memories.userId, userId));
  const now = Date.now();
  const day24 = now - 86400000;
  const week7d = now - 604800000;
  const byCategory: Record<string, number> = {};
  all.forEach(m => { byCategory[m.category] = (byCategory[m.category] || 0) + 1; });
  return {
    total: all.length,
    byCategory,
    recent24h: all.filter(m => m.createdAt >= day24).length,
    last7d: all.filter(m => m.createdAt >= week7d).length,
  };
}

// ---- Tasks ----
export async function getUserTasks(userId: number, options?: { status?: 'pending' | 'thinking' | 'done'; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(tasks.userId, userId)];
  if (options?.status) conditions.push(eq(tasks.status, options.status));
  return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt)).limit(options?.limit ?? 50).offset(options?.offset ?? 0);
}

export async function getTaskById(id: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1);
  return rows[0];
}

export async function createTask(data: { id: string; userId: number; title: string; description?: string; status?: 'pending' | 'thinking' | 'done'; priority?: 'low' | 'medium' | 'high' | 'critical'; subtasks?: string; agentId?: string; progress?: number; memoryIds?: string; result?: string; createdAt: number; updatedAt: number }) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(tasks).values(data);
  return data;
}

export async function updateTask(id: string, userId: number, data: Partial<{ title: string; description: string; status: 'pending' | 'thinking' | 'done'; priority: 'low' | 'medium' | 'high' | 'critical'; subtasks: string; agentId: string; progress: number; result: string; updatedAt: number }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set({ ...data, updatedAt: data.updatedAt ?? Date.now() }).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

export async function deleteTask(id: string, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

// ---- Agents ----
export async function getUserAgents(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agents).where(eq(agents.userId, userId)).orderBy(asc(agents.name));
}

export async function getAgentById(id: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(agents).where(and(eq(agents.id, id), eq(agents.userId, userId))).limit(1);
  return rows[0];
}

export async function createAgent(data: { id: string; userId: number; name: string; type: 'research' | 'coding' | 'content' | 'planning' | 'automation' | 'browser' | 'email'; description?: string; config?: string; createdAt: number; updatedAt: number }) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(agents).values(data);
  return data;
}

export async function updateAgent(id: string, userId: number, data: Partial<{ name: string; type: 'research' | 'coding' | 'content' | 'planning' | 'automation' | 'browser' | 'email'; status: 'idle' | 'active' | 'paused'; description: string; config: string; lastRunAt: number; updatedAt: number }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(agents).set({ ...data, updatedAt: data.updatedAt ?? Date.now() }).where(and(eq(agents.id, id), eq(agents.userId, userId)));
}

export async function deleteAgent(id: string, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(agents).where(and(eq(agents.id, id), eq(agents.userId, userId)));
}

// ---- Insights ----
export async function getUserInsights(userId: number, options?: { type?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(insights.userId, userId)];
  if (options?.type) conditions.push(eq(insights.type, options.type as any));
  return db.select().from(insights).where(and(...conditions)).orderBy(desc(insights.createdAt)).limit(options?.limit ?? 20);
}

export async function createInsight(data: { id: string; userId: number; type: 'daily' | 'weekly' | 'monthly' | 'pattern' | 'opportunity' | 'prediction' | 'reflection'; title: string; content: string; metrics?: string; createdAt: number }) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(insights).values(data);
  return data;
}

// ---- Events ----
export async function getUserEvents(userId: number, options?: { limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).where(eq(events.userId, userId)).orderBy(desc(events.createdAt)).limit(options?.limit ?? 50);
}

export async function createEvent(data: { id: string; userId: number; type: string; payload?: string; agentId?: string; memoryId?: string; taskId?: string; createdAt: number }) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(events).values(data);
  return data;
}

// ---- Chat ----
export async function getUserChatSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt)).limit(20);
}

export async function getChatSessionMessages(sessionId: string, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.userId, userId))).orderBy(asc(chatMessages.createdAt));
}

export async function createChatSession(data: { id: string; userId: number; title?: string; modelId?: string; messageCount?: number; createdAt: number; updatedAt: number }) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(chatSessions).values(data);
  return data;
}

export async function updateChatSession(id: string, userId: number, data: Partial<{ title: string; modelId: string; messageCount: number; updatedAt: number }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(chatSessions).set({ ...data, updatedAt: data.updatedAt ?? Date.now() }).where(and(eq(chatSessions.id, id), eq(chatSessions.userId, userId)));
}

export async function createChatMessage(data: { id: string; sessionId: string; userId: number; role: 'user' | 'assistant' | 'system'; content: string; tokensUsed?: number; createdAt: number }) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(chatMessages).values(data);
  return data;
}

// ---- Bulk delete for privacy ----
export async function deleteAllUserData(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
  await db.delete(chatSessions).where(eq(chatSessions.userId, userId));
  await db.delete(events).where(eq(events.userId, userId));
  await db.delete(insights).where(eq(insights.userId, userId));
  await db.delete(tasks).where(eq(tasks.userId, userId));
  await db.delete(agents).where(eq(agents.userId, userId));
  await db.delete(memories).where(eq(memories.userId, userId));
}
