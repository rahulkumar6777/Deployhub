const PROJECT_PUBLIC_ROUTES = new Map([
    ['/health', new Set(['GET'])],
    ['/projects', new Set(['POST'])],
]);


export const resolveProjectRoutePath = (path) => path;

const respond = (req, res, status, message) =>
    res.status(status).json({ success: false, message, traceId: req.traceId });

export const enforceProjectAccessPolicy = (req, res, next) => {
    const allowedMethods = PROJECT_PUBLIC_ROUTES.get(resolveProjectRoutePath(req.path));

    if (!allowedMethods) {
        return respond(req, res, 404, 'Not found');
    }

    if (!allowedMethods.has(req.method)) {
        res.setHeader('Allow', [...allowedMethods].join(', '));
        return respond(req, res, 405, 'Method not allowed');
    }

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is(['application/json', 'application/*+json'])) {
        return respond(req, res, 415, 'Content-Type must be application/json');
    }

    const hasBody = req.headers['transfer-encoding'] !== undefined ||
        Number(req.headers['content-length'] || 0) > 0;
    if (req.method === 'GET' && hasBody) {
        return respond(req, res, 400, 'GET requests must not include a body');
    }

    next();
};
