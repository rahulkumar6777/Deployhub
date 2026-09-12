const IDENTITY_PUBLIC_ROUTES = new Map([
    ['/health', new Set(['GET'])],
    ['/register/init', new Set(['POST'])],
    ['/register/verify', new Set(['POST'])],
    ['/github', new Set(['GET'])],
    ['/github/callback', new Set(['GET'])],
    ['/login', new Set(['POST'])],
    ['/sessions', new Set(['GET', 'DELETE'])],
    ['/sessions/:tokenId', new Set(['DELETE'])],
    ['/refresh/token', new Set(['GET'])]
]);

export const resolveIdentityRoutePath = (path) => /^\/sessions\/[^/]+$/.test(path) ? '/sessions/:tokenId' : path;

const respond = (req, res, status, message) =>
    res.status(status).json({ success: false, message, traceId: req.traceId });

export const enforceIdentityAccessPolicy = (req, res, next) => {
    const allowedMethods = IDENTITY_PUBLIC_ROUTES.get(resolveIdentityRoutePath(req.path));

    if (!allowedMethods) {
        return respond(req, res, 404, 'Not found');
    }

    if (!allowedMethods.has(req.method)) {
        res.setHeader('Allow', [...allowedMethods].join(', '));
        return respond(req, res, 405, 'Method not allowed');
    }

    if (req.method === 'POST' && !req.is(['application/json', 'application/*+json'])) {
        return respond(req, res, 415, 'Content-Type must be application/json');
    }

    const hasBody = req.headers['transfer-encoding'] !== undefined ||
        Number(req.headers['content-length'] || 0) > 0;
    if (req.method === 'GET' && hasBody) {
        return respond(req, res, 400, 'GET requests must not include a body');
    }

    next();
};
