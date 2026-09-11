import { isIP } from 'node:net';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { print as defaultLogger } from '../../../../shared/utils/print.js';

const PROXY_TIMEOUT_MS = 15_000;
const REQUEST_START = Symbol('gatewayProxyRequestStart');

const UNTRUSTED_FORWARD_HEADERS = Object.freeze([
    'connection',
    'expect',
    'forwarded',
    'proxy-authorization',
    'proxy-connection',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'x-auth-request-email',
    'x-auth-request-user',
    'x-envoy-external-address',
    'x-forwarded-client-cert',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-port',
    'x-forwarded-proto',
    'x-internal-secret',
    'x-original-url',
    'x-real-ip',
    'x-rewrite-url',
    'x-user-context',
]);

const GATEWAY_OWNED_RESPONSE_HEADERS = Object.freeze([
    'access-control-allow-credentials',
    'access-control-allow-headers',
    'access-control-allow-methods',
    'access-control-allow-origin',
    'access-control-expose-headers',
    'access-control-max-age',
    'content-security-policy',
    'cross-origin-opener-policy',
    'cross-origin-resource-policy',
    'origin-agent-cluster',
    'permissions-policy',
    'referrer-policy',
    'strict-transport-security',
    'x-content-type-options',
    'x-dns-prefetch-control',
    'x-download-options',
    'x-frame-options',
    'x-internal-secret',
    'x-permitted-cross-domain-policies',
    'x-trace-id',
    'x-user-context',
]);

const normalizeIp = (req) => {
    let ip = String(req.ip || req.socket?.remoteAddress || '').trim();
    if (ip.startsWith('::ffff:')) ip = ip.slice(7);
    return isIP(ip) ? ip : '';
};

const safePath = (req) =>
    String(req.originalUrl || req.url || '').split('?', 1)[0].slice(0, 512);

const validateTarget = (target) => {
    let parsed;
    try {
        parsed = new URL(target);
    } catch {
        throw new Error('Proxy target must be a valid URL');
    }

    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
        throw new Error('Proxy target must be an HTTP(S) URL without credentials');
    }
    return parsed.href.replace(/\/$/, '');
};

const respondToProxyError = (err, req, res, logger, serviceName) => {
    const timedOut = ['ETIMEDOUT', 'ESOCKETTIMEDOUT'].includes(err.code);
    const status = timedOut ? 504 : 502;

    logger.error({
        service: serviceName,
        method: req.method,
        path: safePath(req),
        errorCode: err.code || 'PROXY_ERROR',
        traceId: req.traceId,
    }, 'Proxy request failed');

    if (res.headersSent) {
        res.destroy(err);
        return;
    }

    res.writeHead(status, {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'X-Trace-Id': req.traceId,
    });
    res.end(JSON.stringify({
        success: false,
        message: timedOut ? 'Upstream service timed out' : 'Upstream service unavailable',
        traceId: req.traceId,
    }));
};

export default (
    target,
    serviceName,
    { internalSecret, logger = defaultLogger, proxyTimeoutMs = PROXY_TIMEOUT_MS } = {},
) => {
    if (
        typeof internalSecret !== 'string' ||
        internalSecret.length < 32 ||
        /[\r\n]/.test(internalSecret)
    ) {
        throw new Error('A strong internalSecret is required for the proxy');
    }
    if (!Number.isInteger(proxyTimeoutMs) || proxyTimeoutMs < 1) {
        throw new Error('proxyTimeoutMs must be a positive integer');
    }

    return createProxyMiddleware({
        target: validateTarget(target),
        changeOrigin: true,
        ws: false,
        xfwd: false,
        on: {
            proxyReq: (proxyReq, req) => {
                for (const header of UNTRUSTED_FORWARD_HEADERS) {
                    proxyReq.removeHeader(header);
                }

                proxyReq.setHeader('X-Internal-Secret', internalSecret);
                proxyReq.setHeader('X-Trace-Id', req.traceId);

                const ip = normalizeIp(req);
                if (ip) {
                    proxyReq.setHeader('X-Forwarded-For', ip);
                    proxyReq.setHeader('X-Real-IP', ip);
                }

                const protocol = req.protocol === 'https' ? 'https' : 'http';
                proxyReq.setHeader('X-Forwarded-Proto', protocol);

                fixRequestBody(proxyReq, req);
                proxyReq.setTimeout(proxyTimeoutMs, () => {
                    const timeoutError = new Error('Upstream service timed out');
                    timeoutError.code = 'ETIMEDOUT';
                    proxyReq.destroy(timeoutError);
                });
                req[REQUEST_START] = Date.now();

                logger.info({
                    service: serviceName,
                    method: req.method,
                    path: safePath(req),
                    traceId: req.traceId,
                }, 'Request forwarded to service');
            },

            proxyRes: (proxyRes, req, res) => {
                res.removeHeader('Server');
                res.removeHeader('X-Powered-By');
                delete proxyRes.headers.server;
                delete proxyRes.headers['x-powered-by'];
                for (const header of GATEWAY_OWNED_RESPONSE_HEADERS) {
                    delete proxyRes.headers[header];
                }

                proxyRes.headers['cache-control'] = 'no-store';
                proxyRes.headers.pragma = 'no-cache';

                const latency = Date.now() - (req[REQUEST_START] || Date.now());
                logger.info({
                    service: serviceName,
                    method: req.method,
                    path: safePath(req),
                    status: proxyRes.statusCode,
                    latency: `${latency}ms`,
                    traceId: req.traceId,
                }, 'Response received from service');
            },

            error: (err, req, res) =>
                respondToProxyError(err, req, res, logger, serviceName),
        },
    });
};
