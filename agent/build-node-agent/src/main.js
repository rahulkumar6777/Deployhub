import { buildApp } from "./app.js";
import { nodeVerify } from "./config/nodeVerify.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { connectRedis } from "./config/redis.js";

const app = await buildApp();



const start = async (port) => {

    await nodeVerify();
    await connectRedis();
    await connectRabbitMQ()
    app.listen(port, () => {
        console.log(`server is running on port ${port}`)
    })
};

start(process.env.PORT || 4522);


// jobs shedule
import './jobs/nodeverification.jobs.js'
import './worker/build.worker.js'