import { cacheKey } from '../../../../shared/cache/cacheKey.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { getRedis } from '../config/redis.js';
import { deleteAllSessions } from './session.service.js';


const scanSessionKeys = async (redis, userId) => {
    const pattern = cacheKey.createSessionKey(userId, '*');
    let cursor = '0';
    const keys = [];

    do {
        const [nextCursor, batch] = await redis.scan(
            cursor,
            'MATCH',
            pattern,
            'COUNT',
            100
        );

        cursor = nextCursor;
        keys.push(...batch);

    } while (cursor !== '0');

    return keys;
};

const getTokenIdFromKey = (key) => key.split(':').pop();


export const listSessions = async ({ userId, currentTokenId }) => {
    const redis = getRedis();
    const keys = await scanSessionKeys(redis, userId);

    if (!keys.length) return [];

    const values = await redis.mget(...keys);

    return values
        .map((value, index) => {
            if (!value) return null;

            const tokenId = getTokenIdFromKey(keys[index]);
            const session = JSON.parse(value);

            return {
                tokenId,
                current: tokenId === currentTokenId,
                ip: session.ip || '',
                userAgent: session.userAgent || '',
                device: session.device || '',
                createdAt: session.createdAt || 0,
            };
        })
        .filter(Boolean)
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
};


export const revokeSession = async ({ userId, tokenId }) => {
    if (!tokenId) {
        throw new AppError('Session tokenId is required', 400);
    }

    const redis = getRedis();
    await redis.del(cacheKey.createSessionKey(userId, tokenId));

    return true;
};


export const revokeAllSessions = async ({ userId }) => {
    const redis = getRedis();
    await deleteAllSessions(redis, userId);

    return true;
};
