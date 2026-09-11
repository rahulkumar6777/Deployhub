import http from 'node:http';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { print } from '../../shared/utils/print.js';
import { createShutdownHandler } from '../../shared/utils/gracefulShutdown.js';
import { connectRedis, closeRedis, getRedis } from './src/config/redis.js';
import { ENV } from './src/lib/env.js';
import { startHealthCheck } from './src/middlewares/healthCheck.js';
import { configureRateLimitRedisProvider, ingressRateLimitMiddleware } from './src/middlewares/rateLimit.js';
import { rejectReservedHeaders, validateRequestTarget } from './src/middlewares/requestSecurity.js';
import { traceMiddleware } from './src/middlewares/trace.middleware.js';
import routes from './src/router/index.js';
import { corsOption } from './src/utils/cors.js';

const JSON_BODY_LIMIT = '100kb';
configureRateLimitRedisProvider(getRedis);
const SERVER_LIMITS = Object.freeze({
    headersTimeout: 10_000,
    requestTimeout: 15_000,
    socketTimeout: 20_000,
    keepAliveTimeout: 5_000,
    maxHeaderSize: 16 * 1024,
    maxHeadersCount: 100,
    maxRequestsPerSocket: 100,
});

const securityHeaders = () => {
    const options = {
        crossOriginResourcePolicy: { policy: 'same-site' },
        xFrameOptions: { action: 'deny' },
        contentSecurityPolicy: {
            directives: {
                'upgrade-insecure-requests': ENV.NODE_ENV === 'production' ? [] : null,
            },
        },
    };

    if (ENV.NODE_ENV !== 'production') {
        options.strictTransportSecurity = false;
    }
    return helmet(options);
};

const compressionFilter = (req, res) => {
    if (req.originalUrl.startsWith('/api/v1/auth')) return false;
    return compression.filter(req, res);
};

const errorDetails = (error) => {
    if (error.code === 'CORS_ORIGIN_DENIED') {
        return { status: 403, message: 'Origin is not allowed' };
    }
    if (error.type === 'entity.too.large') {
        return { status: 413, message: 'Request body is too large' };
    }
    if (error.type === 'encoding.unsupported') {
        return { status: 415, message: 'Compressed request bodies are not supported' };
    }
    if (error.type === 'entity.parse.failed') {
        return { status: 400, message: 'Malformed JSON body' };
    }
    if (error.code === 'RATE_LIMIT_UNAVAILABLE') {
        return { status: 503, message: 'Gateway protection service is unavailable' };
    }
    return { status: 500, message: 'Internal server error' };
};

export const createApp = () => {
    const app = express();

    app.set('case sensitive routing', true);
    app.set('strict routing', true);
    app.set('trust proxy', ENV.TRUST_PROXY);
    app.disable('x-powered-by');

    app.use(securityHeaders());
    app.use(traceMiddleware);
    app.use(validateRequestTarget);
    app.use(compression({ threshold: 1024, filter: compressionFilter }));

    app.get('/gateway/health', (_req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({ status: 'ok' });
    });

    app.use('/api', ingressRateLimitMiddleware);
    app.use('/api', rejectReservedHeaders);
    app.use('/api', cors(corsOption));
    app.use('/api', express.json({
        limit: JSON_BODY_LIMIT,
        strict: true,
        inflate: false,
        type: ['application/json', 'application/*+json'],
    }));
    app.use('/api', routes);

    app.use((req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        res.status(404).json({
            success: false,
            message: 'Not found',
            traceId: req.traceId,
        });
    });

    app.use((error, req, res, next) => {
        if (res.headersSent) return next(error);

        const { status, message } = errorDetails(error);
        const log = status >= 500 ? print.error : print.warn;
        log.call(print, 'Gateway request failed', {
            status,
            errorName: error.name,
            errorCode: error.code,
            traceId: req.traceId,
        });

        res.setHeader('Cache-Control', 'no-store');
        if (status === 503) res.setHeader('Retry-After', '1');
        return res.status(status).json({
            success: false,
            message,
            traceId: req.traceId,
        });
    });

    return app;
};

export async function startApp(port) {
    await connectRedis();
    const interval = await startHealthCheck();
    const server = http.createServer({
        headersTimeout: SERVER_LIMITS.headersTimeout,
        requestTimeout: SERVER_LIMITS.requestTimeout,
        keepAliveTimeout: SERVER_LIMITS.keepAliveTimeout,
        maxHeaderSize: SERVER_LIMITS.maxHeaderSize,
        connectionsCheckingInterval: 1000,
    }, createApp());

    server.maxHeadersCount = SERVER_LIMITS.maxHeadersCount;
    server.maxRequestsPerSocket = SERVER_LIMITS.maxRequestsPerSocket;
    server.setTimeout(SERVER_LIMITS.socketTimeout);

    try {
        await new Promise((resolve, reject) => {
            const onError = (error) => reject(error);
            server.once('error', onError);
            server.listen(port, () => {
                server.off('error', onError);
                resolve();
            });
        });
    } catch (error) {
        clearInterval(interval);
        await closeRedis();
        throw error;
    }

    print.log(`API Gateway is running on port ${port}`);

    const shutdown = createShutdownHandler({
        server,
        logger: print,
        closeResources: [
            () => clearInterval(interval),
            closeRedis,
        ],
    });

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    return server;
}
