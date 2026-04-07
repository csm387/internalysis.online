import type { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export function registerSwagger(app: FastifyInstance) {
  app.register(swagger, {
    openapi: {
      info: {
        title: "internalysis.online API",
        version: "0.1.0",
      },
    },
  });
  app.register(swaggerUi, {
    routePrefix: "/docs",
  });
}

