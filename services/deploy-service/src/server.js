import { loadSecrets } from "./core/config/secretsloader.js";

// load secrets
await loadSecrets();

const { DEPLOY_SERVICE_ENV } = await import("./lib/env.js")

// start app
const { default: startApp } = await import("./index.js");
await startApp(DEPLOY_SERVICE_ENV.PORT, DEPLOY_SERVICE_ENV.SERVICE_NAME);
