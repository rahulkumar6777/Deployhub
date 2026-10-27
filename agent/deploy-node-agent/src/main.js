
import { buildApp } from "./app.js";
import { nodeVerify } from "./config/nodeVerify.js";
import { envs } from "./lib/env.js";


const app = buildApp();


// jobs shedule
import './jobs/nodeverification.jobs.js'


async function start() {
    try {

        process.env.IS_NODEMANAGER_READY === "true" ? await nodeVerify() : process.exit(1)
        app.listen({
            host: "127.0.0.1",
            port: envs.PORT,
        });
    } catch (error) {
        app.log.error(error);
        process.exitCode = 1;
    }
}

start();
