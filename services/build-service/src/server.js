import { loadSecrets } from "./core/config/secretsloader.js";

// load secrets
await loadSecrets();

const { buildEnv } = await import("./lib/env.js")

// start app
const { default: startApp } = await import("./index.js");
await startApp(buildEnv.PORT, buildEnv.SERVICE_NAME);