import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";

import { registerHealthRoutes } from "./web/health.js";
import { registerSwagger } from "./web/swagger.js";
import { registerAuthRoutes } from "./web/auth.js";
import { authPlugin } from "./web/authPlugin.js";
import { registerScenarioRoutes } from "./web/scenarios.js";
import { registerProgressRoutes } from "./web/progress.js";
import { registerAssetRoutes } from "./web/assets.js";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const app = Fastify({
  logger: true,
  trustProxy: true,
});

const FRONTEND_ORIGIN = requireEnv("FRONTEND_ORIGIN");

await app.register(cors, {
  origin: (origin, cb) => {
    // Allow same-origin / server-to-server
    if (!origin) return cb(null, true);
    if (origin === FRONTEND_ORIGIN) return cb(null, true);
    return cb(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
});

await app.register(cookie);

await app.register(helmet, {
  global: true,
  contentSecurityPolicy: false, // UI is frontend; API only
});

await app.register(rateLimit, {
  global: true,
  max: 300,
  timeWindow: "1 minute",
});

registerSwagger(app);
registerHealthRoutes(app);
await app.register(authPlugin);
registerAuthRoutes(app);
registerScenarioRoutes(app);
registerProgressRoutes(app);
registerAssetRoutes(app);

app.setErrorHandler((err, _req, reply) => {
  const status = reply.statusCode >= 400 ? reply.statusCode : 500;
  reply.code(status);
  const message =
    status >= 500
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Request failed";
  if (status >= 500) app.log.error(err);
  return { error: message };
});

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

await app.listen({ port, host });

