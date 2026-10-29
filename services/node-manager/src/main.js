import { buildApp } from "./app.js";
import { connectToMongoDB } from "./config/database/mongodb.js";
import { connectRabbitMQ } from "./config/message-broker/rabbitmq.js";
import { connectRedis } from "./config/redis/redis.js";
import { envs } from "./lib/env.js";

const app = buildApp();


// routes
import routes from "./router/router.route.js";

app.use('/api/v1', routes);

const start = async (port) => {

    await connectToMongoDB();
    await connectRedis();
    await connectRabbitMQ();

    app.listen(port, () => {
        console.log(`Node Manager service is running on port ${port}`);
    });
};

start(envs.PORT);