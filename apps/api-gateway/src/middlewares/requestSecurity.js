const MAX_REQUEST_TARGET_LENGTH = 4096;
const RESERVED_CLIENT_HEADERS = Object.freeze([
    'x-internal-secret',
    'x-microservice-secret',
    'x-user-context',
]);

const jsonError = (res, status, message, traceId) =>
    res.status(status).json({ success: false, message, traceId });

export const validateRequestTarget = (req, res, next) => {
    const requestTarget = req.originalUrl || req.url || '';
    const lowerTarget = requestTarget.toLowerCase();

    if (requestTarget.length > MAX_REQUEST_TARGET_LENGTH) {
        return jsonError(res, 414, 'Request target is too long', req.traceId);
    }

    if (
        lowerTarget.startsWith('http://') ||
        lowerTarget.startsWith('https://') ||
        lowerTarget.includes('\\') ||
        lowerTarget.includes('%5c') ||
        lowerTarget.includes('%00')
    ) {
        return jsonError(res, 400, 'Invalid request target', req.traceId);
    }

    next();
};

export const rejectReservedHeaders = (req, res, next) => {
    if (RESERVED_CLIENT_HEADERS.some((header) => req.headers[header] !== undefined)) {
        return jsonError(res, 400, 'Reserved gateway header is not allowed', req.traceId);
    }
    next();
};
