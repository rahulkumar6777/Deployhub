import { createProxyMiddleware } from 'http-proxy-middleware';
import { print as logger } from '../../../../shared/utils/print.js';

export default (target, serviceName) =>
    createProxyMiddleware({
        target,
        changeOrigin: true,
        ws: false,
        buffer: false,
        selfHandleResponse: false,
        on: {
            proxyReq: (proxyReq, req) => {
                proxyReq.setHeader("x-internal-secret", process.env.INTERNAL_SECRET);
                proxyReq.setHeader("x-trace-id", req.traceId);
                proxyReq.startTime = Date.now();
                if (req.user) {
                    proxyReq.setHeader("x-user-context", JSON.stringify(req.user));
                }

                const ip = req.ip || req.socket?.remoteAddress || '';
                if (ip) {
                    proxyReq.setHeader('X-Forwarded-For', ip);
                    proxyReq.setHeader('X-Real-IP', ip);
                }
                const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
                proxyReq.setHeader('X-Forwarded-Proto', proto);

                logger.info({
                    service: serviceName,
                    method: req.method,
                    url: req.url,
                    traceId: req.traceId,
                }, 'Request forwarded to service');
            },

            proxyRes(proxyRes, req, res) {
                const latency = Date.now() - proxyRes.req.startTime;


                if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
                    res.setHeader('X-Accel-Buffering', 'no')
                    res.flushHeaders()
                }

                logger.info({
                    service: serviceName,
                    method: req.method,
                    url: req.url,
                    status: proxyRes.statusCode,
                    latency: `${latency}ms`,
                    traceId: req.traceId,
                }, 'Response received from service');
            },

            error(err, req) {
                logger.error({
                    service: serviceName,
                    method: req.method,
                    url: req.url,
                    error: err.message,
                    traceId: req.traceId,
                }, 'Proxy error occurred');
            }
        }
    });