import express from 'express';
import { logger } from './src/config/logger.js';
import { print } from '../shared/logger/print.js';


const app = express();


app.set("trust proxy", true);
app.disable("x-powered-by");
app.use(express.json({ limit: '100kb' }))


app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`, { ip: req.ip });
    next();
});


app.use("/health", (_req, res) => {

    const seconds = Math.floor(process.uptime());

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    res.status(200).json({
        serviceName: "secret-Manager",
        uptime: `${hours}h ${minutes}m ${secs}s`
    })
})


app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});


app.use((err, _req, res, _next) => {
    print.error('Unhandled error:', { err: err.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
});

export default app;
