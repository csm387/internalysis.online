import { z } from "zod";
import { prisma } from "../db/prisma.js";
const progressSchema = z.object({
    discoveredClueIds: z.array(z.string()),
    connections: z.array(z.object({ a: z.string(), b: z.string() })),
    notesByClueId: z.record(z.string(), z.string()),
    progress: z.object({
        stage: z.number().int().min(0),
        milestones: z.array(z.string()),
    }),
});
export function registerProgressRoutes(app) {
    app.get("/progress/:scenarioId", async (req, reply) => {
        await app.requireAuth(req, reply);
        const scenarioId = req.params.scenarioId;
        const userId = req.user.id;
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
        if (!row)
            return { progress: null };
        return {
            progress: {
                discoveredClueIds: row.discoveredClueIds,
                connections: row.connections,
                notesByClueId: row.notesByClueId,
                progress: { stage: row.progressStage, milestones: row.milestones },
                updatedAt: row.updatedAt,
            },
        };
    });
    app.put("/progress/:scenarioId", async (req, reply) => {
        await app.requireAuth(req, reply);
        const scenarioId = req.params.scenarioId;
        const userId = req.user.id;
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
                discoveredClueIds: parsed.data.discoveredClueIds,
                connections: parsed.data.connections,
                notesByClueId: parsed.data.notesByClueId,
                progressStage: parsed.data.progress.stage,
                milestones: parsed.data.progress.milestones,
            },
            update: {
                discoveredClueIds: parsed.data.discoveredClueIds,
                connections: parsed.data.connections,
                notesByClueId: parsed.data.notesByClueId,
                progressStage: parsed.data.progress.stage,
                milestones: parsed.data.progress.milestones,
            },
            select: { updatedAt: true },
        });
        return { ok: true, updatedAt: up.updatedAt };
    });
}
