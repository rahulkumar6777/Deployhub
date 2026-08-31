import { ENV } from "../lib/env.js";

const origins = [ENV.FRONTEND_URI, ENV.ADMIN_FRONTEND_URL].filter(Boolean);

export const corsOption = {
    origin(origin, callback) {
        if (!origin || origins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}
