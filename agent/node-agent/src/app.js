
import Fastify from "fastify";
import dotenv from 'dotenv';
dotenv.config();


export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.get("/health", async () => {
    return {
      status: "ok",
      service: "node-agent",
    };
  });

  return app;
}
