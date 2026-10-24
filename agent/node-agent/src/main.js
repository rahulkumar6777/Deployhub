
import { buildApp } from "./app.js";
import { nodeVerify } from "./config/nodeVerify.js";
import { envs } from "./lib/env.js";


const app = buildApp();

async function start() {
    try {

        await nodeVerify()
        await app.listen({
            host: "127.0.0.1",
            port: envs.PORT,
        });
    } catch (error) {
        app.log.error(error);
        process.exitCode = 1;
    }
}

start();
