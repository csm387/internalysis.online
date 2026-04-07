import { z } from "zod";
import { prisma } from "../db/prisma.js";
const scenarioUpsertSchema = z.object({
    id: z.string().min(3).max(64),
    name: z.string().min(1).max(120),
    json: z.any(),
    pinned: z.boolean().optional(),
});
const scenarioUpdateSchema = z.object({
    name: z.string().min(1).max(120).optional(),
    json: z.any().optional(),
    pinned: z.boolean().optional(),
});
export function registerScenarioRoutes(app) {
    app.get("/scenarios", async (req, reply) => {
        await app.requireAuth(req, reply);
        const ownerId = req.user.id;
        const list = await prisma.scenario.findMany({
            where: { ownerId },
            select: { id: true, name: true, pinned: true, updatedAt: true, createdAt: true },
            orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
        });
        return { scenarios: list };
    });
    app.post("/scenarios", async (req, reply) => {
        await app.requireAuth(req, reply);
        const parsed = scenarioUpsertSchema.safeParse(req.body);
        if (!parsed.success) {
            reply.code(400);
            return { error: "Invalid input" };
        }
        const ownerId = req.user.id;
        const created = await prisma.scenario.upsert({
            where: { id: parsed.data.id },
            create: {
                id: parsed.data.id,
                ownerId,
                name: parsed.data.name,
                json: parsed.data.json,
                pinned: parsed.data.pinned ?? false,
            },
            update: {
                // Ownership check: only owner can update; otherwise reject below
                name: parsed.data.name,
                json: parsed.data.json,
                pinned: parsed.data.pinned ?? undefined,
            },
        });
        if (created.ownerId !== ownerId) {
            reply.code(403);
            return { error: "Forbidden" };
        }
        return { scenario: { id: created.id, name: created.name, pinned: created.pinned } };
    });
    app.get("/scenarios/:id", async (req, reply) => {
        await app.requireAuth(req, reply);
        const id = req.params.id;
        const ownerId = req.user.id;
        const s = await prisma.scenario.findFirst({
            where: { id, ownerId },
            select: { id: true, name: true, pinned: true, json: true, updatedAt: true, createdAt: true },
        });
        if (!s) {
            reply.code(404);
            return { error: "Not found" };
        }
        return { scenario: s };
    });
    app.put("/scenarios/:id", async (req, reply) => {
        await app.requireAuth(req, reply);
        const id = req.params.id;
        const ownerId = req.user.id;
        const parsed = scenarioUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            reply.code(400);
            return { error: "Invalid input" };
        }
        const existing = await prisma.scenario.findFirst({ where: { id, ownerId }, select: { id: true } });
        if (!existing) {
            reply.code(404);
            return { error: "Not found" };
        }
        const updated = await prisma.scenario.update({
            where: { id },
            data: {
                name: parsed.data.name,
                json: parsed.data.json,
                pinned: parsed.data.pinned,
            },
            select: { id: true, name: true, pinned: true, updatedAt: true },
        });
        return { scenario: updated };
    });
    app.delete("/scenarios/:id", async (req, reply) => {
        await app.requireAuth(req, reply);
        const id = req.params.id;
        const ownerId = req.user.id;
        const existing = await prisma.scenario.findFirst({ where: { id, ownerId }, select: { id: true } });
        if (!existing) {
            reply.code(404);
            return { error: "Not found" };
        }
        await prisma.scenario.delete({ where: { id } });
        return { ok: true };
    });
}
