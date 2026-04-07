import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma";

const progressSchema = z.object({
  discoveredClueIds: z.array(z.string()),
  connections: z.array(z.object({ a: z.string(), b: z.string() })),
  notesByClueId: z.record(z.string(), z.string()),
  progress: z.object({
    stage: z.number().int().min(0),
    milestones: z.array(z.string()),
  }),
});

export function registerProgressRoutes(app: FastifyInstance) {
  app.get("/progress/:scenarioId", async (req, reply) => {
    await app.requireAuth(req, reply);
    const scenarioId = (req.params as any).scenarioId as string;
    const userId = req.user!.id;
    const row = await prisma.progress.findUnique({
      where: { userId_scenarioId: { userId, scenarioId } },
      select: {
        discoveredClueIds: true,
        connections: true,
        notesByClueId: true,
        progressStage: true,
        milestones: true,
        updatedAt: true,
      },
    });
    if (!row) return { progress: null };
    return {
      progress: {
        discoveredClueIds: row.discoveredClueIds as unknown,
        connections: row.connections as unknown,
        notesByClueId: row.notesByClueId as unknown,
        progress: { stage: row.progressStage, milestones: row.milestones as unknown },
        updatedAt: row.updatedAt,
      },
    };
  });

  app.put("/progress/:scenarioId", async (req, reply) => {
    await app.requireAuth(req, reply);
    const scenarioId = (req.params as any).scenarioId as string;
    const userId = req.user!.id;
    const parsed = progressSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: "Invalid input" };
    }

    // Ensure scenario belongs to user (private progress)
    const scenario = await prisma.scenario.findFirst({ where: { id: scenarioId, ownerId: userId }, select: { id: true } });
    if (!scenario) {
      reply.code(404);
      return { error: "Scenario not found" };
    }

    const up = await prisma.progress.upsert({
      where: { userId_scenarioId: { userId, scenarioId } },
      create: {
        userId,
        scenarioId,
        discoveredClueIds: parsed.data.discoveredClueIds as any,
        connections: parsed.data.connections as any,
        notesByClueId: parsed.data.notesByClueId as any,
        progressStage: parsed.data.progress.stage,
        milestones: parsed.data.progress.milestones as any,
      },
      update: {
        discoveredClueIds: parsed.data.discoveredClueIds as any,
        connections: parsed.data.connections as any,
        notesByClueId: parsed.data.notesByClueId as any,
        progressStage: parsed.data.progress.stage,
        milestones: parsed.data.progress.milestones as any,
      },
      select: { updatedAt: true },
    });

    return { ok: true, updatedAt: up.updatedAt };
  });
}

