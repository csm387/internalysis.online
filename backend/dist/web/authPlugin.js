import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "../db/prisma.js";
const SESSION_COOKIE = "mistery_session";
const CSRF_COOKIE = "mistery_csrf";
function sha256Hex(input) {
    return createHash("sha256").update(input).digest("hex");
}
function generateToken() {
    return randomBytes(32).toString("base64url");
}
function setCookie(reply, name, value, opts) {
    reply.setCookie(name, value, {
        path: "/",
        httpOnly: opts?.httpOnly ?? true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });
}
export async function authPlugin(app) {
    // Attach user (if session cookie exists)
    app.addHook("preHandler", async (req) => {
        const token = req.cookies[SESSION_COOKIE];
        if (!token)
            return;
        const tokenHash = sha256Hex(token);
        const session = await prisma.session.findUnique({ where: { tokenHash } });
        if (!session)
            return;
        if (session.expiresAt.getTime() < Date.now())
            return;
        req.user = { id: session.userId };
    });
    // CSRF: for state-changing requests, require header to match cookie (double submit)
    app.addHook("preHandler", async (req, reply) => {
        const method = req.method.toUpperCase();
        if (method === "GET" || method === "HEAD" || method === "OPTIONS")
            return;
        // Allow establishing session without CSRF cookie.
        if (req.url.startsWith("/auth/login") || req.url.startsWith("/auth/register"))
            return;
        const csrfCookie = req.cookies[CSRF_COOKIE];
        const csrfHeader = (req.headers["x-csrf"] ?? "");
        if (!csrfCookie || !csrfHeader) {
            reply.code(403);
            throw new Error("CSRF token missing");
        }
        const a = Buffer.from(csrfCookie);
        const b = Buffer.from(csrfHeader);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
            reply.code(403);
            throw new Error("CSRF token invalid");
        }
    });
    app.decorate("requireAuth", async (req, reply) => {
        if (req.user?.id)
            return;
        reply.code(401);
        throw new Error("Unauthorized");
    });
    app.decorate("issueSession", async (reply, userId) => {
        const token = generateToken();
        const tokenHash = sha256Hex(token);
        const csrf = generateToken();
        await prisma.session.create({
            data: {
                userId,
                tokenHash,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 14 days
            },
        });
        setCookie(reply, SESSION_COOKIE, token, { httpOnly: true });
        setCookie(reply, CSRF_COOKIE, csrf, { httpOnly: false });
    });
    app.decorate("clearSession", async (req, reply) => {
        const token = req.cookies[SESSION_COOKIE];
        if (token) {
            const tokenHash = sha256Hex(token);
            await prisma.session.deleteMany({ where: { tokenHash } });
        }
        reply.clearCookie(SESSION_COOKIE, { path: "/" });
        reply.clearCookie(CSRF_COOKIE, { path: "/" });
    });
}
