import express from 'express';
import { print } from '../../shared/utils/print.js';


const app = express();


app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: '100kb' }))


//compression
import compression from 'compression';
app.use(compression());


// cookie parser
import cookieParser from 'cookie-parser';
import { createShutdownHandler } from '../../shared/utils/gracefulShutdown.js';
app.use(cookieParser());


// health point
app.use("/gateway/health", (_req, res) => {

    const seconds = Math.floor(process.uptime());

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    res.status(200).json({
        serviceName: "api-gateway",
        uptime: `${hours}h ${minutes}m ${secs}s`,
    })
})

app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});


app.use((err, _req, res, _next) => {
    print.error('Unhandled error:', { err: err.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
});

export async function startApp(port) {

    const server = app.listen(port, () => {
        console.log(`Api Gateway is running on port ${port}`);
    });

    const shutdown = createShutdownHandler({
        server,
        logger: console,
        closeResources: []
    });

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}