import express from "express";
import cookieParser from "cookie-parser";
import { print } from "../../shared/utils/print.js";
import { createInternalAUthMiddleware } from "../../shared/middlewares/internalAuth.js";
import { createShutdownHandler } from "../../shared/utils/gracefulShutdown.js";
import { env } from "./src/lib/env.js";
import { connectRedis } from "./src/config/redis.js";
import { checkFileUploaderReady } from "./src/config/fileUploaderChecker.js";


const app = express();



app.set("trust proxy", 1);
app.disable("x-powered-by")
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());


// security
import helmet from "helmet";
import hpp from "hpp";
import { closeDb, connectDb } from "./src/config/mongo.js";
app.use(helmet());
app.use(hpp());


// health
app.use("/health", (_req, res) => {

    const seconds = Math.floor(process.uptime());

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return res.status(200).json({
        serviceName: env.SERVICE_NAME,
        uptime: `${hours}h ${minutes}m ${secs}s`,
    })
})


// Service calls authenticate independently of the gateway secret.
import internalRouter from './src/routes/internalRoutes.js';
app.use('/internal', internalRouter, (_req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});


// Gateway authentication for public identity endpoints.
app.use(createInternalAUthMiddleware({
    secret: env.INTERNAL_SECRET,
    logger: print,
    header: "x-internal-secret",
}));


import identityRouter from './src/routes/routes.js'
app.use('/', identityRouter);


app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});


app.use((err, _req, res, _next) => {
    print.error('Unhandled error:', { err: err.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
});

export default async function startApp(port) {

    await connectRedis();
    await connectDb();
    await checkFileUploaderReady();
    const server = app.listen(port, () => {
        print.log(`Identity server running on port ${port}`);
    });

    const shutdown = createShutdownHandler({
        server,
        logger: print,
        closeResources: [closeDb],
    });

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
