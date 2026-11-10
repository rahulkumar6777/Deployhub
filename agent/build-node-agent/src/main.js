import { buildApp } from './app.js';
const app = await buildApp();

const [{ nodeVerify }, { connectRabbitMQ }, { connectRedis }, { globalBuildSheduler },] = await Promise.all([
    import('./config/nodeVerify.js'),
    import('./config/rabbitmq.js'),
    import('./config/redis.js'),
    import('./worker/build.worker.js'),
]);


await import('./jobs/nodeverification.jobs.js');

const start = async (port) => {
    await nodeVerify();
    await connectRedis();
    await connectRabbitMQ();

    app.listen(port, () => {
        console.log(`server is running on port ${port}`);
    });

    await globalBuildSheduler();
};

await start(process.env.PORT || 4522);
