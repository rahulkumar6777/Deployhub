import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { env } from '../lib/env.js';
import { getRedis } from '../config/redis.js';
import { cacheKey } from '../../../../shared/cache/cacheKey.js';


export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const extractDevice = (ua = '') => {
    ua = ua.toLowerCase();

    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('windows')) return 'Windows PC';
    if (ua.includes('mac')) return 'Mac';
    if (ua.includes('linux')) return 'Linux';

    return 'Unknown Device';
};

export const hashRefreshToken = (refreshToken) =>
    crypto.createHash('sha256').update(refreshToken).digest('hex');

export const generateRefreshToken = (userId, tokenId) => {
    return jwt.sign(
        {
            _id: userId
        },
        env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: env.REFRESH_TOKEN_EXPIRY,
            jwtid: tokenId
        }
    );
};

export const generateAccessToken = (userId, tokenId) => {
    return jwt.sign(
        {
            _id: userId,
            tokenId
        },
        env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: env.ACCESS_TOKEN_EXPIRY
        }
    );
};

export const generateToken = async (userId, req) => {
    const tokenId = crypto.randomUUID();
    const redis = getRedis();

    const refreshToken = generateRefreshToken(userId, tokenId);

    await redis.set(
        cacheKey.createSessionKey(userId, tokenId),
        JSON.stringify({
            hashedToken: hashRefreshToken(refreshToken),
            ip: req?.ip || '',
            userAgent: req?.headers?.['user-agent'] || '',
            device: extractDevice(req?.headers?.['user-agent']),
            createdAt: Date.now(),
        }),
        'EX',
        SESSION_TTL_SECONDS
    );

    return {
        RefreshToken: refreshToken,
        AccessToken: generateAccessToken(userId, tokenId),
        tokenId
    };
};

export const deleteAllSessions = async (redis, userId) => {
    const pattern = cacheKey.createSessionKey(userId, '*');
    let cursor = '0';

    do {
        const [nextCursor, keys] = await redis.scan(
            cursor,
            'MATCH',
            pattern,
            'COUNT',
            100
        );

        cursor = nextCursor;

        if (keys.length > 0) {
            await redis.del(...keys);
        }

    } while (cursor !== '0');
};

export const GenerateAccessToken = generateAccessToken;
