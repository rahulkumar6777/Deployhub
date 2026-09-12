import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../lib/env.js';
import { getRedis } from '../config/redis.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { SESSION_TTL_SECONDS, deleteAllSessions, generateAccessToken, generateRefreshToken, hashRefreshToken, } from './session.service.js';
import { cacheKey } from '../../../../shared/cache/cacheKey.js';

const REFRESH_ROTATION_GRACE_SECONDS = 10;
const REFRESH_LOCK_SECONDS = 5;

const readRotationResult = async ({ redis, userId, tokenId, incomingHash, userAgent }) => {
    const rotationData = await redis.get(cacheKey.createRefreshRotationKey(userId, tokenId));
    if (!rotationData) {
        return null;
    }

    const rotation = JSON.parse(rotationData);
    if (rotation.oldHash !== incomingHash) {
        await deleteAllSessions(redis, userId);
        throw new AppError('Token reuse detected. All sessions revoked.', 403);
    }

    if (rotation.userAgent && userAgent && rotation.userAgent !== userAgent) {
        await deleteAllSessions(redis, userId);
        throw new AppError('Token reuse detected. All sessions revoked.', 403);
    }

    return {
        AccessToken: rotation.AccessToken,
        RefreshToken: rotation.RefreshToken,
        tokenId: rotation.tokenId,
    };
};

const waitForRotationResult = async ({ redis, userId, tokenId, incomingHash, userAgent }) => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const result = await readRotationResult({ redis, userId, tokenId, incomingHash, userAgent });
        if (result) {
            return result;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return null;
};

export const refreshTokenService = async ({ refreshToken, ip, userAgent }) => {

    const redis = getRedis();

    // here if refreshtoken not found
    if (!refreshToken) {
        throw new AppError("no refreshToken Found", 401);
    };


    // here i decode token
    let payload;
    try {
        payload = await jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
    } catch (_error) {
        throw new AppError("invalid refreshToken", 401);
    };


    const userId = payload._id;
    const tokenId = payload.jti;

    if (!userId || !tokenId) {
        throw new AppError('invalid token payload', 401);
    }

    const sessionKey = cacheKey.createSessionKey(userId, tokenId);
    const incommingHash = hashRefreshToken(refreshToken);
    const sessionData = await redis.get(sessionKey);
    if (!sessionData) {
        const rotationResult = await readRotationResult({ redis, userId, tokenId, incomingHash: incommingHash, userAgent });
        if (rotationResult) {
            return rotationResult;
        }

        throw new AppError('Invalid Sessions', 401);
    }

    const lockKey = cacheKey.createRefreshLockKey(userId, tokenId);
    const lockAcquired = await redis.set(lockKey, '1', 'EX', REFRESH_LOCK_SECONDS, 'NX');
    if (!lockAcquired) {
        const rotationResult = await waitForRotationResult({ redis, userId, tokenId, incomingHash: incommingHash, userAgent });
        if (rotationResult) {
            return rotationResult;
        }

        throw new AppError('Refresh token rotation in progress. Please retry.', 409);
    }

    const session = JSON.parse(sessionData);

    if (incommingHash !== session.hashedToken) {
        await deleteAllSessions(redis, userId);
        throw new AppError('Token reuse detected. All sessions revoked.', 403);
    };

    const newTokenId = crypto.randomUUID();
    const newRefreshToken = generateRefreshToken(userId, newTokenId);
    const newSession = {
        ...session,
        hashedToken: hashRefreshToken(newRefreshToken),
        ip: ip || session.ip || '',
        userAgent: userAgent || session.userAgent || '',
        createdAt: session.createdAt || Date.now(),
        rotatedAt: Date.now(),
    };

    const AccessToken = generateAccessToken(userId, newTokenId);
    const rotationResult = {
        oldHash: incommingHash,
        userAgent: userAgent || session.userAgent || '',
        AccessToken,
        RefreshToken: newRefreshToken,
        tokenId: newTokenId,
    };

    await redis
        .multi()
        .set(createSessionKey(userId, newTokenId), JSON.stringify(newSession), 'EX', SESSION_TTL_SECONDS)
        .set(cacheKey.createRefreshRotationKey(userId, tokenId), JSON.stringify(rotationResult), 'EX', REFRESH_ROTATION_GRACE_SECONDS)
        .del(sessionKey)
        .del(lockKey)
        .exec();

    return {
        AccessToken,
        RefreshToken: newRefreshToken,
        tokenId: newTokenId
    };
};
