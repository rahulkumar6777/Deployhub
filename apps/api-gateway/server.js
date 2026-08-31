import { loadSecrets } from './src/config/secretsloader.js';


// load secrets
await loadSecrets();

const { ENV } = await import('./src/lib/env.js');

// start app
const { default: startApp } = await import("./index.js");
await startApp(ENV.PORT);
