import { buildApp } from './app.js';

// Load bootstrap credentials and service secrets before importing any modules
// that validate or capture process.env at module scope.
const app = await buildApp();

const [
    { nodeVerify },
    { connectRabbitMQ },
    { connectRedis },
    { globalBuildSheduler },
] = await Promise.all([
    import('./config/nodeVerify.js'),
    import('./config/rabbitmq.js'),
    import('./config/redis.js'),
    import('./worker/build.worker.js'),
]);

// This job also imports nodeVerify, so load it after secrets too.
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
