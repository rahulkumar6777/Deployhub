import { loadSecrets } from "./src/config/secretsloader.js";


// load secrets
await loadSecrets();

const { env } = await import("./src/lib/env.js");

// start app
const { default: startApp } = await import("./index.js");
await startApp(env.PORT);