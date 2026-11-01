import jwt from 'jsonwebtoken';
import { cacheKey } from '../../../../shared/cache/cacheKey.js';
import { getRedis } from '../config/redis.js';
import { ENV } from '../lib/env.js';

const sendUnauthorized = (req, res, message) => {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(401).json({
        success: false,
        message,
        traceId: req.traceId,
    });
};

/**
 * Verifies a DeployHub access token, checks that its session is still active,
 * and attaches the trusted identity to req.user. Mount on any protected
 * gateway service/router before its proxy middleware.
 */
export const createUserAuthentication = ({ optional = false } = {}) =>
    async (req, res, next) => {
        const authorization = req.headers.authorization;
        const match = typeof authorization === 'string'
            ? /^Bearer\s+([^\s]+)$/i.exec(authorization)
            : null;

        if (!match) {
            if (optional && !authorization) return next();
            return sendUnauthorized(req, res, 'A valid access token is required');
        }

        let decoded;
        try {
            decoded = jwt.verify(match[1], ENV.ACCESS_TOKEN_SECRET, {
                algorithms: ['HS256'],
            });
        } catch {
            return sendUnauthorized(req, res, 'Invalid or expired access token');
        }

        const userId = decoded?._id;
        const tokenId = decoded?.tokenId;
        if (
            typeof userId !== 'string' ||
            !/^[a-f\d]{24}$/i.test(userId) ||
            typeof tokenId !== 'string' ||
            !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(tokenId)
        ) {
            return sendUnauthorized(req, res, 'Invalid access token payload');
        }

        try {
            const sessionKey = cacheKey.createSessionKey(userId, tokenId);
            const session = await getRedis().get(sessionKey);
            if (!session) {
                return sendUnauthorized(req, res, 'Session expired or logged out');
            }

            req.user = Object.freeze({ _id: userId, tokenId });
            return next();
        } catch (error) {
            return next(error);
        }
    };

export const authenticateUser = createUserAuthentication();
export const optionalUserAuthentication = createUserAuthentication({ optional: true });
