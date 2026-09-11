import { ENV } from "../lib/env.js";

const origins = new Set([ENV.FRONTEND_URI, ENV.ADMIN_FRONTEND_URL].filter(Boolean));

export const corsOption = {
    origin(origin, callback) {
        if (!origin || origins.has(origin)) {
            return callback(null, true);
        }
        const error = new Error('CORS origin denied');
        error.code = 'CORS_ORIGIN_DENIED';
        error.status = 403;
        return callback(error);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Trace-Id', 'Retry-After'],
    maxAge: 600,
    optionsSuccessStatus: 204,
}
