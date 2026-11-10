
import { buildApp } from "./app.js";
const app = await buildApp();


const [{ nodeVerify }, { connectRabbitMQ }, { connectRedis }] = await Promise.all([
    import('./config/nodeVerify.js'),
    import('./config/rabbitmq.js'),
    import('./config/redis.js')
]);


// jobs shedule
await import('./jobs/nodeverification.jobs.js');


const start = async (PORT) => {
    try {

        await nodeVerify();
        await connectRedis();
        await connectRabbitMQ()
        app.listen({
            host: "127.0.0.1",
            port: PORT,
        });
    } catch (error) {
        app.log.error(error);
        process.exitCode = 1;
    }
}

await start(process.env.PORT);
