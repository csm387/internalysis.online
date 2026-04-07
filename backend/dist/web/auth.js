import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "../db/prisma";
const emailPasswordSchema = z.object({
    email: z.string().email().max(254),
    password: z.string().min(8).max(128),
});
export function registerAuthRoutes(app) {
    app.post("/auth/register", {
        config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    }, async (req, reply) => {
        const parsed = emailPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            reply.code(400);
            return { error: "Invalid input" };
        }
        const email = parsed.data.email.toLowerCase();
        const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
        try {
            const user = await prisma.user.create({ data: { email, passwordHash } });
            await app.issueSession(reply, user.id);
            return { ok: true, user: { id: user.id, email: user.email } };
        }
        catch {
            reply.code(409);
            return { error: "Email already in use" };
        }
    });
    app.post("/auth/login", {
        config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    }, async (req, reply) => {
        const parsed = emailPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            reply.code(400);
            return { error: "Invalid input" };
        }
        const email = parsed.data.email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            reply.code(401);
            return { error: "Invalid credentials" };
        }
        const ok = await argon2.verify(user.passwordHash, parsed.data.password);
        if (!ok) {
            reply.code(401);
            return { error: "Invalid credentials" };
        }
        await app.issueSession(reply, user.id);
        return { ok: true, user: { id: user.id, email: user.email } };
    });
    app.post("/auth/logout", async (req, reply) => {
        await app.clearSession(req, reply);
        return { ok: true };
    });
    app.get("/me", async (req) => {
        if (!req.user?.id)
            return { user: null, csrfToken: null };
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true },
        });
        return { user, csrfToken: req.cookies["mistery_csrf"] ?? null };
    });
}
