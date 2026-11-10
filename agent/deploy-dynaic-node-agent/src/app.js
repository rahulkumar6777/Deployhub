
import Fastify from "fastify";
import { loadSecrets } from './config/secretsloader.js'

export const buildApp = async () => {

  const app = Fastify({
    logger: true,
  });

  await loadSecrets();

  app.get("/health", async () => {
    return {
      status: "ok",
      service: "node-agent",
    };
  });

  return app;
}
