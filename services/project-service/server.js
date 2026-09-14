import { loadSecret } from "./src/config/secretLoader.js";


// load secrets
await loadSecret();

const { env } = await import("./src/lib/env.js");

// start app
const { default: startApp } = await import("./index.js");
await startApp(env.PORT);