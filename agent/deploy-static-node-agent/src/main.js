
import { buildApp } from "./app.js";
const app = await buildApp();


const [{ nodeVerify }, { envs }, { connectRedis }, { connectRabbitMQ }] = await Promise.all([
    import('./config/nodeVerify.js'),
    import('./lib/env.js'),
    import('./config/redis.js'),
    import('./config/rabbitmq.js')
]);


// jobs shedule
await import('./jobs/nodeverification.jobs.js');


async function start() {
    try {

        await nodeVerify();
        await connectRedis();
        await connectRabbitMQ();

        app.listen({
            host: "127.0.0.1",
            port: envs.PORT,
        });

    } catch (error) {
        app.log.error(error);
        process.exitCode = 1;
    }
};

await start();