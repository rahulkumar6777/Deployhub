import jwt from 'jsonwebtoken';
import { getClearRefreshTokenOptions } from '../utils/cookieOption.js';
import { getRedis } from '../config/redis.js';
import { env } from '../lib/env.js';
import { cacheKey } from '../../../../shared/cache/cacheKey.js';
import { returnError } from '../../../../shared/errors/sendError.js';


export const logoutController = async (req, res) => {
    try {
        const redis = getRedis();

        const accessToken = req.headers['authorization']?.split(' ')[1] || req.cookies?.AccessToken;

        if (!accessToken) {
            return res
                .clearCookie('RefreshToken', getClearRefreshTokenOptions())
                .status(200)
                .json({ message: 'No token found, but logout success' });
        }

        try {
            const decoded = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET);

            if (decoded._id && decoded.tokenId) {
                await redis.del(cacheKey.createSessionKey(decoded._id, decoded.tokenId));
            }
        } catch (error) {
            return res
                .clearCookie('RefreshToken', getClearRefreshTokenOptions())
                .status(400)
                .json({ message: 'Invalid or expired token, logout failed' });
        }

        return res
            .clearCookie('RefreshToken', getClearRefreshTokenOptions())
            .status(200)
            .json({ message: 'Logout success' });

    } catch (error) {
        returnError(res, error)
    }
};
