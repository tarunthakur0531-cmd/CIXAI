import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
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

/**
 * Memories: core data unit — captures notes, ideas, decisions, facts.
 */
export const memories = mysqlTable("memories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  title: varchar("title", { length: 256 }),
  category: mysqlEnum("category", ["note", "idea", "decision", "fact", "observation", "project", "meeting", "document", "learning", "research"]).default("note").notNull(),
  tags: text("tags"), // JSON array of strings
  source: varchar("source", { length: 64 }), // e.g. "chatgpt", "manual", "browser"
  aiModel: varchar("aiModel", { length: 64 }),
  confidenceScore: int("confidenceScore").default(50), // 0-100
  project: varchar("project", { length: 128 }),
  people: text("people"), // JSON array
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Memory = typeof memories.$inferSelect;
export type InsertMemory = typeof memories.$inferInsert;

/**
 * Tasks: agent-driven or user-created tasks with status tracking.
 */
export const tasks = mysqlTable("tasks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "thinking", "done"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium"),
  subtasks: text("subtasks"), // JSON array of {id, title, status}
  agentId: varchar("agentId", { length: 36 }),
  progress: int("progress").default(0), // 0-100
  memoryIds: text("memoryIds"), // JSON array of related memory IDs
  result: text("result"), // AI-generated result/insight
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Agents: autonomous agents with status.
 */
export const agents = mysqlTable("agents", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["research", "coding", "content", "planning", "automation", "browser", "email"]).notNull(),
  status: mysqlEnum("status", ["idle", "active", "paused"]).default("idle").notNull(),
  description: text("description"),
  config: text("config"), // JSON config
  lastRunAt: bigint("lastRunAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Events: event bus log for agent communication and system events.
 */
export const events = mysqlTable("events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 64 }).notNull(), // e.g. "MemoryCreated", "TaskCompleted"
  payload: text("payload"), // JSON payload
  agentId: varchar("agentId", { length: 36 }),
  memoryId: varchar("memoryId", { length: 36 }),
  taskId: varchar("taskId", { length: 36 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Brain Insights: AI-generated summaries, patterns, trends.
 */
export const insights = mysqlTable("insights", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["daily", "weekly", "monthly", "pattern", "opportunity", "prediction", "reflection"]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  metrics: text("metrics"), // JSON metrics data
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = typeof insights.$inferInsert;

/**
 * Chat sessions for the Brain Chat.
 */
export const chatSessions = mysqlTable("chatSessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }),
  modelId: varchar("modelId", { length: 128 }),
  messageCount: int("messageCount").default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

/**
 * Chat messages for the Brain Chat.
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sessionId: varchar("sessionId", { length: 36 }).notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  tokensUsed: int("tokensUsed"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
