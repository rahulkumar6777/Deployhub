import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import { DEPLOY_SERVICE_ENV } from "./lib/env.js";
import { closeDb, connectDb } from "./core/db/mongo.js";
import { closeRedis, connectRedis } from "./core/redis/client.js";
import { closeRabbitMQ, connectRabbitMQ } from "./core/message-broker/rabbitmq.js";
import { createShutdownHandler } from "../../../shared/utils/gracefulShutdown.js";
import { createInternalAUthMiddleware } from "../../../shared/middlewares/internalAuth.js";

const app = express();


// security middlewares
app.use(helmet());
app.use(hpp());
app.set("trust proxy", 1);


// parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// health
app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'Healthy' });
});


// internal auth
app.use(createInternalAUthMiddleware({
    secret: DEPLOY_SERVICE_ENV.INTERNAL_SECRET,
    logger: console,
    header: "x-internal-secret",
}));

import userContext from "../../../shared/middlewares/userContext.js";
app.use(userContext);


export default async function startApp(port, service_name) {
    await connectDb();
    await connectRedis();
    await connectRabbitMQ();

    const server = app.listen(port, () => {
        console.log(`${service_name} running on port ${port}`);
    });

    const shutdown = createShutdownHandler({
        server,
        logger: console,
        closeResources: [closeRabbitMQ, closeRedis, closeDb],
    });

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
