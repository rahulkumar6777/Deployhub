import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';
import { getRedis } from '../config/redis.js';
import { cacheKey } from '../../../../shared/cache/cacheKey.js';

export const verifyJWT = async (req, res, next) => {
    try {

        const redis = getRedis();
        const token = req.headers['authorization']?.split(' ')[1] || req.cookies?.AccessToken;

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        const { _id: userId, tokenId } = decoded;

        if (!userId || !tokenId) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        const sessionKey = cacheKey.createSessionKey(userId, tokenId);
        const sessionData = await redis.get(sessionKey);

        if (!sessionData) {
            return res.status(401).json({
                message: 'Session expired or logged out'
            });
        }


        req.user = {
            _id: userId,
            tokenId
        };

        next();

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
