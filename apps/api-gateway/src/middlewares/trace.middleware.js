import { randomUUID } from 'node:crypto';

const SAFE_TRACE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export const traceMiddleware = (req, res, next) => {
    const incoming = req.headers['x-trace-id'];
    const candidate = typeof incoming === 'string' ? incoming.trim() : '';
    const traceId = SAFE_TRACE_ID.test(candidate) ? candidate : randomUUID();

    req.traceId = traceId;
    res.setHeader('X-Trace-Id', traceId);
    next();
};
