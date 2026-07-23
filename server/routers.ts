import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import { invokeLLM, listLLMModels } from "./_core/llm";

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

  // ---- Memories ----
  memories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserMemories(ctx.user.id);
    }),
    listByCategory: protectedProcedure.input(z.object({ category: z.string() })).query(async ({ ctx, input }) => {
      return db.getUserMemories(ctx.user.id, { category: input.category });
    }),
    search: protectedProcedure.input(z.object({ query: z.string() })).query(async ({ ctx, input }) => {
      return db.getUserMemories(ctx.user.id, { search: input.query });
    }),
    get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
      return db.getMemoryById(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      content: z.string().min(1),
      title: z.string().optional(),
      category: z.enum(['note', 'idea', 'decision', 'fact', 'observation', 'project', 'meeting', 'document', 'learning', 'research']).optional(),
      tags: z.array(z.string()).optional(),
      source: z.string().optional(),
      aiModel: z.string().optional(),
      confidenceScore: z.number().min(0).max(100).optional(),
      project: z.string().optional(),
      people: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = nanoid();
      const now = Date.now();
      await db.createMemory({
        id, userId: ctx.user.id, content: input.content,
        title: input.title || undefined, category: input.category || 'note',
        tags: input.tags ? JSON.stringify(input.tags) : undefined,
        source: input.source || undefined, aiModel: input.aiModel || undefined,
        confidenceScore: input.confidenceScore ?? 50,
        project: input.project || undefined,
        people: input.people ? JSON.stringify(input.people) : undefined,
        createdAt: now, updatedAt: now,
      });
      await db.createEvent({
        id: nanoid(), userId: ctx.user.id, type: 'MemoryCreated',
        payload: JSON.stringify({ id, title: input.title }),
        memoryId: id, createdAt: now,
      });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.string(), content: z.string().optional(),
      title: z.string().optional(), category: z.enum(['note', 'idea', 'decision', 'fact', 'observation', 'project', 'meeting', 'document', 'learning', 'research']).optional(),
      tags: z.array(z.string()).optional(), project: z.string().optional(),
      people: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {};
      if (input.content !== undefined) updateData.content = input.content;
      if (input.title !== undefined) updateData.title = input.title;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags);
      if (input.project !== undefined) updateData.project = input.project;
      if (input.people !== undefined) updateData.people = JSON.stringify(input.people);
      updateData.updatedAt = Date.now();
      await db.updateMemory(input.id, ctx.user.id, updateData as any);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
      await db.deleteMemory(input.id, ctx.user.id);
      return { success: true };
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getMemoryStats(ctx.user.id);
    }),
  }),

  // ---- Tasks ----
  tasks: router({
    list: protectedProcedure.input(z.object({ status: z.enum(['pending', 'thinking', 'done']).optional() }).optional()).query(async ({ ctx, input }) => {
      return db.getUserTasks(ctx.user.id, { status: input?.status });
    }),
    get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
      return db.getTaskById(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1), description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      agentId: z.string().optional(), memoryIds: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = nanoid();
      const now = Date.now();
      await db.createTask({
        id, userId: ctx.user.id, title: input.title,
        description: input.description || undefined,
        status: 'pending' as const,
        priority: input.priority || 'medium',
        subtasks: undefined, agentId: input.agentId || undefined,
        progress: 0, memoryIds: input.memoryIds ? JSON.stringify(input.memoryIds) : undefined,
        result: undefined, createdAt: now, updatedAt: now,
      });
      await db.createEvent({
        id: nanoid(), userId: ctx.user.id, type: 'TaskCreated',
        payload: JSON.stringify({ id, title: input.title }),
        taskId: id, createdAt: now,
      });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.string(), title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['pending', 'thinking', 'done']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      progress: z.number().min(0).max(100).optional(),
      result: z.string().optional(),
      subtasks: z.array(z.object({ id: z.string(), title: z.string(), status: z.string() })).optional(),
    })).mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.progress !== undefined) updateData.progress = input.progress;
      if (input.result !== undefined) updateData.result = input.result;
      if (input.subtasks !== undefined) updateData.subtasks = JSON.stringify(input.subtasks);
      updateData.updatedAt = Date.now();
      await db.updateTask(input.id, ctx.user.id, updateData as any);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
      await db.deleteTask(input.id, ctx.user.id);
      return { success: true };
    }),
    decompose: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
      const task = await db.getTaskById(input.id, ctx.user.id);
      if (!task) throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });

      try {
        const response = await invokeLLM({
          messages: [
            { role: 'system' as const, content: 'You are CIX Task Decomposer. Analyze the task title and description, then break it into 3-7 actionable subtasks. Return ONLY valid JSON with format: { "subtasks": [{ "id": "sub-1", "title": "...", "status": "pending" }] }.' },
            { role: 'user' as const, content: `Title: ${task.title}\nDescription: ${task.description || 'No description provided'}` },
          ],
          response_format: { type: 'json_object' },
        });
        const rawContent = response.choices[0]?.message?.content;
        const parsed = JSON.parse(typeof rawContent === 'string' ? rawContent : '{}');
        const subtasks = Array.isArray(parsed.subtasks) ? parsed.subtasks : [];

        await db.updateTask(input.id, ctx.user.id, {
          subtasks: JSON.stringify(subtasks),
          status: 'thinking',
          updatedAt: Date.now(),
        } as any);

        await db.createEvent({
          id: nanoid(), userId: ctx.user.id, type: 'TaskDecomposed',
          payload: JSON.stringify({ id: input.id, subtaskCount: subtasks.length }),
          taskId: input.id, createdAt: Date.now(),
        });

        return { subtasks, success: true };
      } catch {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to decompose task with LLM' });
      }
    }),
  }),

  // ---- Agents ----
  agents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserAgents(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
      return db.getAgentById(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      type: z.enum(['research', 'coding', 'content', 'planning', 'automation', 'browser', 'email']),
      description: z.string().optional(),
      config: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = nanoid();
      const now = Date.now();
      await db.createAgent({
        id, userId: ctx.user.id, name: input.name, type: input.type,
        description: input.description || undefined,
        config: input.config ? JSON.stringify(input.config) : undefined,
        createdAt: now, updatedAt: now,
      });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.string(), name: z.string().optional(),
      type: z.enum(['research', 'coding', 'content', 'planning', 'automation', 'browser', 'email']).optional(),
      status: z.enum(['idle', 'active', 'paused']).optional(),
      description: z.string().optional(),
      config: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.config !== undefined) updateData.config = JSON.stringify(input.config);
      updateData.updatedAt = Date.now();
      await db.updateAgent(input.id, ctx.user.id, updateData as any);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
      await db.deleteAgent(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  // ---- Brain Chat ----
  chat: router({
    sessions: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserChatSessions(ctx.user.id);
    }),
    messages: protectedProcedure.input(z.object({ sessionId: z.string() })).query(async ({ ctx, input }) => {
      return db.getChatSessionMessages(input.sessionId, ctx.user.id);
    }),
    send: protectedProcedure.input(z.object({
      sessionId: z.string().optional(),
      message: z.string().min(1),
      modelId: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const now = Date.now();
      let sessionId = input.sessionId || nanoid();

      // If new session
      if (!input.sessionId) {
        await db.createChatSession({
          id: sessionId, userId: ctx.user.id,
          title: input.message.slice(0, 60),
          modelId: input.modelId || undefined,
          messageCount: 1, createdAt: now, updatedAt: now,
        });
      }

      // Save user message
      await db.createChatMessage({
        id: nanoid(), sessionId, userId: ctx.user.id,
        role: 'user', content: input.message, createdAt: now,
      });

      // Get recent memories for context
      const recentMemories = await db.getUserMemories(ctx.user.id, { limit: 10 });
      const memoryContext = recentMemories.length > 0
        ? `Relevant memories:\n${recentMemories.map(m => `- [${m.category}] ${m.title || m.content.slice(0, 100)}: ${m.content.slice(0, 200)}`).join('\n')}`
        : 'No recent memories found. The user may be starting fresh.';

      // Build prompt with context
      const messages = [
        { role: 'system' as const, content: `You are CIX, the Human Intelligence Layer — a personal AI second brain. You help the user understand, organize, and reason about their memories and knowledge. You provide clear, actionable insights. Be concise but thorough. Use markdown formatting.\n\n${memoryContext}` },
        { role: 'user' as const, content: input.message },
      ];

      try {
        const response = await invokeLLM({
          model: input.modelId || undefined,
          messages,
        });
        const rawAiContent = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
        const aiContent = typeof rawAiContent === 'string' ? rawAiContent : 'Sorry, I could not generate a response.';

        // Save assistant message
        await db.createChatMessage({
          id: nanoid(), sessionId, userId: ctx.user.id,
          role: 'assistant', content: aiContent,
          tokensUsed: response.usage?.completion_tokens || 0,
          createdAt: Date.now(),
        });

        // Update session
        await db.updateChatSession(sessionId, ctx.user.id, {
          messageCount: 2,
          modelId: input.modelId || response.model,
          updatedAt: Date.now(),
        });

        return { sessionId, content: aiContent };
      } catch (error) {
        return { sessionId, content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }),
    newSession: protectedProcedure.input(z.object({ title: z.string().optional(), modelId: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const id = nanoid();
      const now = Date.now();
      await db.createChatSession({
        id, userId: ctx.user.id,
        title: input.title || 'New Session',
        modelId: input.modelId || undefined,
        messageCount: 0, createdAt: now, updatedAt: now,
      });
      return { id };
    }),
  }),

  // ---- Model Gateway ----
  models: router({
    list: protectedProcedure.query(async () => {
      try {
        const response = await listLLMModels();
        return response.data.map(m => ({ id: m.id, ownedBy: m.owned_by }));
      } catch {
        return [];
      }
    }),
  }),

  // ---- Brain Insights ----
  insights: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserInsights(ctx.user.id);
    }),
    generate: protectedProcedure.mutation(async ({ ctx }) => {
      const memories = await db.getUserMemories(ctx.user.id, { limit: 50 });
      const now = Date.now();
      const dayAgo = now - 86400000;
      const weekAgo = now - 604800000;

      const recentMemories = memories.filter(m => m.createdAt >= dayAgo);
      const weeklyMemories = memories.filter(m => m.createdAt >= weekAgo);

      // Generate daily insight
      if (recentMemories.length > 0) {
        const memorySummaries = recentMemories.map(m => `- [${m.category}] ${m.title || m.content.slice(0, 100)}`).join('\n');
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system' as const, content: 'You are CIX Brain Engine. Generate a daily insight summary from the user\'s recent memories. Include: 1) Key themes detected 2) Patterns observed 3) Actionable recommendations 4) Cognitive load assessment. Format as markdown. Be specific and data-driven.' },
              { role: 'user' as const, content: `Today's captures:\n${memorySummaries}` },
            ],
          });
          const rawContent = response.choices[0]?.message?.content;
          const content = typeof rawContent === 'string' ? rawContent : 'No patterns detected today.';
          await db.createInsight({
            id: nanoid(), userId: ctx.user.id, type: 'daily',
            title: `Daily Brain Summary — ${new Date().toLocaleDateString()}`,
            content, createdAt: now,
          });
        } catch {}
      }

      // Generate weekly insight
      if (weeklyMemories.length > 5) {
        const weeklySummaries = weeklyMemories.map(m => `- [${m.category}] ${m.content.slice(0, 150)}`).join('\n');
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system' as const, content: 'You are CIX Brain Engine. Generate a weekly insight report. Include: 1) Top 3 recurring themes 2) Behavioral patterns detected 3) Knowledge gaps identified 4) Suggested next actions 5) Productivity assessment. Format as markdown.' },
              { role: 'user' as const, content: `This week's captures (${weeklyMemories.length} total):\n${weeklySummaries}` },
            ],
          });
          const rawContent = response.choices[0]?.message?.content;
          const content = typeof rawContent === 'string' ? rawContent : 'Weekly analysis complete.';
          await db.createInsight({
            id: nanoid(), userId: ctx.user.id, type: 'weekly',
            title: `Weekly Brain Report — Week of ${new Date().toLocaleDateString()}`,
            content, createdAt: now,
          });
        } catch {}
      }

      // Generate pattern insight
      if (memories.length > 10) {
        const categoryCount: Record<string, number> = {};
        memories.forEach(m => { categoryCount[m.category] = (categoryCount[m.category] || 0) + 1; });
        const categories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(', ');
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system' as const, content: 'You are CIX Brain Engine. Analyze the user\'s memory category distribution and generate pattern insights. Include: 1) Dominant knowledge areas 2) Gaps or imbalances 3) Learning trajectory 4) Suggestions for balanced growth.' },
              { role: 'user' as const, content: `Total memories: ${memories.length}\nCategory distribution: ${categories}` },
            ],
          });
          const rawContent = response.choices[0]?.message?.content;
          const content = typeof rawContent === 'string' ? rawContent : 'Pattern analysis complete.';
          await db.createInsight({
            id: nanoid(), userId: ctx.user.id, type: 'pattern',
            title: 'Memory Pattern Analysis',
            content, createdAt: now,
          });
        } catch {}
      }

      // Generate task decomposition insight
      const tasks = await db.getUserTasks(ctx.user.id, { status: 'pending' });
      if (tasks.length > 0) {
        const taskList = tasks.map(t => `- ${t.title} (${t.priority})`).join('\n');
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system' as const, content: 'You are CIX Brain Engine. Analyze the user\'s pending tasks and generate actionable decomposition. For each task, suggest: 1) Breaking into subtasks 2) Priority ordering 3) Estimated effort 4) Dependencies.' },
              { role: 'user' as const, content: `Pending tasks:\n${taskList}` },
            ],
          });
          const rawContent = response.choices[0]?.message?.content;
          const content = typeof rawContent === 'string' ? rawContent : 'Task analysis complete.';
          await db.createInsight({
            id: nanoid(), userId: ctx.user.id, type: 'opportunity',
            title: 'Task Decomposition & Opportunity Analysis',
            content, createdAt: now,
          });
        } catch {}
      }

      return { success: true, generated: memories.length > 0 };
    }),
  }),

  // ---- Knowledge Graph ----
  graph: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const memories = await db.getUserMemories(ctx.user.id, { limit: 100 });
      const tasks = await db.getUserTasks(ctx.user.id, { limit: 50 });
      const agents = await db.getUserAgents(ctx.user.id);

      // Build nodes
      const nodes = memories.map(m => ({
        id: m.id,
        label: m.title || m.content.slice(0, 40),
        type: 'memory',
        category: m.category,
        size: 8 + (m.confidenceScore || 0) / 15,
      }));

      const taskNodes = tasks.map(t => ({
        id: `task-${t.id}`,
        label: t.title,
        type: 'task',
        category: t.status,
        size: 10,
      }));

      const agentNodes = agents.map(a => ({
        id: `agent-${a.id}`,
        label: a.name,
        type: 'agent',
        category: a.type,
        size: 12,
      }));

      // Build edges (connect by shared tags, projects, or category)
      const edges: Array<{ source: string; target: string; type: string; strength: number }> = [];
      for (let i = 0; i < memories.length; i++) {
        for (let j = i + 1; j < memories.length; j++) {
          const a = memories[i];
          const b = memories[j];
          if (a.project && b.project && a.project === b.project) {
            edges.push({ source: a.id, target: b.id, type: 'project', strength: 0.8 });
          }
          if (a.category === b.category) {
            edges.push({ source: a.id, target: b.id, type: 'category', strength: 0.4 });
          }
          const aTags = a.tags ? JSON.parse(a.tags) : [];
          const bTags = b.tags ? JSON.parse(b.tags) : [];
          const sharedTags = aTags.filter((t: string) => bTags.includes(t));
          if (sharedTags.length > 0) {
            edges.push({ source: a.id, target: b.id, type: 'tag', strength: Math.min(sharedTags.length * 0.3, 1) });
          }
        }
      }

      // Connect tasks to related memories
      tasks.forEach(t => {
        if (t.memoryIds) {
          const memIds: string[] = JSON.parse(t.memoryIds);
          memIds.forEach(mid => {
            edges.push({ source: `task-${t.id}`, target: mid, type: 'task-memory', strength: 0.6 });
          });
        }
      });

      // Connect agents to their tasks
      agents.forEach(a => {
        tasks.filter(t => t.agentId === a.id).forEach(t => {
          edges.push({ source: `agent-${a.id}`, target: `task-${t.id}`, type: 'agent-task', strength: 0.7 });
        });
      });

      return { nodes: [...nodes, ...taskNodes, ...agentNodes], edges };
    }),
  }),

  // ---- Thought Capture ----
  thoughtCapture: router({
    quickCapture: protectedProcedure.input(z.object({
      text: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const now = Date.now();
      const id = nanoid();

      // Auto-tag using LLM
      let tags: string[] = [];
      let category: string = 'note';
      try {
        const response = await invokeLLM({
          messages: [
            { role: 'system' as const, content: 'You are CIX auto-tagger. Analyze the user\'s input and return a JSON object with: "tags" (array of 2-5 relevant tags), "category" (one of: note, idea, decision, fact, observation, project, meeting, document, learning, research), "title" (concise title), "project" (null or project name if detectable). Return ONLY valid JSON.' },
            { role: 'user' as const, content: input.text },
          ],
          response_format: {
            type: 'json_object',
          },
        });
        const rawContent = response.choices[0]?.message?.content;
        const parsed = JSON.parse(typeof rawContent === 'string' ? rawContent : '{}');
        tags = Array.isArray(parsed.tags) ? parsed.tags.map(String) : [];
        category = ['note', 'idea', 'decision', 'fact', 'observation', 'project', 'meeting', 'document', 'learning', 'research'].includes(parsed.category) ? parsed.category : 'note';
        const title = parsed.title || input.text.slice(0, 60);
        const project = parsed.project || null;

        await db.createMemory({
          id, userId: ctx.user.id, content: input.text,
          title, category: category as any,
          tags: tags.length > 0 ? JSON.stringify(tags) : undefined,
          source: 'thought-capture', confidenceScore: 75,
          project: project ?? undefined, createdAt: now, updatedAt: now,
        });
      } catch {
        // Fallback: store without AI tagging
        await db.createMemory({
          id, userId: ctx.user.id, content: input.text,
          title: input.text.slice(0, 60), category: 'note',
          source: 'thought-capture', confidenceScore: 50,
          createdAt: now, updatedAt: now,
        });
      }

      await db.createEvent({
        id: nanoid(), userId: ctx.user.id, type: 'ThoughtCaptured',
        payload: JSON.stringify({ id, text: input.text.slice(0, 100) }),
        memoryId: id, createdAt: now,
      });

      return { id, tags, category };
    }),
  }),

  // ---- Privacy / Data Dashboard ----
  privacy: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const memories = await db.getMemoryStats(ctx.user.id);
      const tasks = await db.getUserTasks(ctx.user.id);
      const agents = await db.getUserAgents(ctx.user.id);
      const events = await db.getUserEvents(ctx.user.id, { limit: 20 });
      const sessions = await db.getUserChatSessions(ctx.user.id);

      return {
        totalMemories: memories.total,
        memoriesByCategory: memories.byCategory,
        recent24h: memories.recent24h,
        last7d: memories.last7d,
        totalTasks: tasks.length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        activeAgents: agents.filter(a => a.status === 'active').length,
        totalAgents: agents.length,
        totalEvents: events.length,
        chatSessions: sessions.length,
        totalStorage: 'calculated',
      };
    }),
    memoriesByCategory: protectedProcedure.query(async ({ ctx }) => {
      const memories = await db.getUserMemories(ctx.user.id);
      const grouped: Record<string, typeof memories> = {};
      memories.forEach(m => {
        if (!grouped[m.category]) grouped[m.category] = [];
        grouped[m.category].push(m);
      });
      return grouped;
    }),
    deleteMemory: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
      await db.deleteMemory(input.id, ctx.user.id);
      return { success: true };
    }),
    deleteAllData: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteAllUserData(ctx.user.id);
      return { success: true, deleted: 'all' };
    }),
    exportData: protectedProcedure.mutation(async ({ ctx }) => {
      const memories = await db.getUserMemories(ctx.user.id);
      const tasks = await db.getUserTasks(ctx.user.id);
      const agents = await db.getUserAgents(ctx.user.id);
      const events = await db.getUserEvents(ctx.user.id, { limit: 1000 });
      const insights = await db.getUserInsights(ctx.user.id);
      return {
        memories, tasks, agents, events, insights,
        exportedAt: Date.now(),
        userId: ctx.user.id,
      };
    }),
  }),

  // ---- Dashboard Overview ----
  dashboard: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      const stats = await db.getMemoryStats(ctx.user.id);
      const recentMemories = await db.getUserMemories(ctx.user.id, { limit: 5 });
      const recentTasks = await db.getUserTasks(ctx.user.id, { limit: 5 });
      const agents = await db.getUserAgents(ctx.user.id);
      const recentEvents = await db.getUserEvents(ctx.user.id, { limit: 10 });
      const recentInsights = await db.getUserInsights(ctx.user.id, { limit: 3 });

      return {
        stats,
        recentMemories,
        recentTasks,
        agents,
        recentEvents: recentEvents.map(e => ({
          ...e,
          payload: e.payload ? JSON.parse(e.payload) : null,
        })),
        recentInsights,
        cognitiveLoad: {
          memoryCount: stats.total,
          recentActivity: stats.recent24h,
          taskLoad: await db.getUserTasks(ctx.user.id, { status: 'pending' }).then(t => t.length),
          activeAgents: agents.filter(a => a.status === 'active').length,
        },
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
