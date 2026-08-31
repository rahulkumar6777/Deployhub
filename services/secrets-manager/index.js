import express from 'express';
import { logger } from './src/config/logger.js';
import { print } from '../../shared/utils/print.js';
import { getRegisteredServices } from './src/services/secretsRegistry.service.js';


const app = express();


app.set("trust proxy", 1);
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
        uptime: `${hours}h ${minutes}m ${secs}s`,
        registeredServices: getRegisteredServices(),
    })
})


import secretsRouter from './src/routes/secrets.routes.js'
app.use('/api/v1/secrets', secretsRouter);


app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});


app.use((err, _req, res, _next) => {
    print.error('Unhandled error:', { err: err.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
});

export default app;
