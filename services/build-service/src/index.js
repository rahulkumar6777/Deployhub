import express from "express";
import { buildEnv } from "./lib/env.js";
import { connectDb, closeDb } from "./core/db/mongo.js";
import { connectRedis } from "./core/redis/client.js";
import { connectRabbitMQ, closeRabbitMQ } from "./core/message-broker/rabbitmq.js";
import { createShutdownHandler } from "../../../shared/utils/gracefulShutdown.js";
import { createInternalAUthMiddleware } from "../../../shared/middlewares/internalAuth.js";
import { print } from "../../../shared/utils/print.js";


const app = express();


// security
app.set("trust proxy", 1);
app.disable("x-powered-by")
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));


// security
import helmet from "helmet";
import hpp from "hpp";
app.use(helmet());
app.use(hpp());


// health
app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'Healthy' });
});


// internal auth
app.use(createInternalAUthMiddleware({
    secret: buildEnv.INTERNAL_SECRET,
    logger: console,
    header: "x-internal-secret",
}));



// ye user chec kakrne ke liye hai means agar user routes pe req ja raha hai jab req.user hona chiaye
import userContext from "../../../shared/middlewares/userContext.js";
app.use(userContext);



//router
import buildRoutes from './routes/build.router.js';
app.use('/', buildRoutes);



export default async function startApp(port, service_name) {
    await connectDb();
    await connectRabbitMQ();
    await connectRedis();

    const server = app.listen(port, () => {
        console.log(`${service_name} running on port ${port}`);
    });

    const shutdown = createShutdownHandler({
        server,
        logger: print,
        closeResources: [closeRabbitMQ, closeDb],
    });

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
};
