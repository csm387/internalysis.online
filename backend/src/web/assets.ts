import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma";

const uploadSchema = z.object({
  dataUrl: z.string().min(16),
});

function parseDataUrl(dataUrl: string) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const mime = m[1]!;
  const b64 = m[2]!;
  return { mime, b64 };
}

export function registerAssetRoutes(app: FastifyInstance) {
  app.post("/assets", async (req, reply) => {
    await app.requireAuth(req, reply);
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: "Invalid input" };
    }

    const out = parseDataUrl(parsed.data.dataUrl);
    if (!out) {
      reply.code(400);
      return { error: "Invalid data URL" };
    }

    if (!out.mime.startsWith("image/")) {
      reply.code(400);
      return { error: "Only images supported" };
    }

    // Rough size check: base64 -> bytes = len * 3/4
    const size = Math.floor((out.b64.length * 3) / 4);
    const max = 2 * 1024 * 1024; // 2MB
    if (size > max) {
      reply.code(413);
      return { error: "Image too large (max 2MB)" };
    }

    const asset = await prisma.asset.create({
      data: {
        ownerId: req.user!.id,
        mime: out.mime,
        size,
        dataBase64: out.b64,
      },
      select: { id: true, mime: true, size: true, createdAt: true },
    });
    return { asset, url: `${process.env.PUBLIC_BASE_URL ?? ""}/assets/${asset.id}` };
  });

  app.get("/assets/:id", async (req, reply) => {
    await app.requireAuth(req, reply);
    const id = (req.params as any).id as string;
    const a = await prisma.asset.findFirst({
      where: { id, ownerId: req.user!.id },
      select: { mime: true, dataBase64: true },
    });
    if (!a) {
      reply.code(404);
      return { error: "Not found" };
    }
    const buf = Buffer.from(a.dataBase64, "base64");
    reply.header("Content-Type", a.mime);
    reply.header("Cache-Control", "private, max-age=3600");
    return reply.send(buf);
  });
}

