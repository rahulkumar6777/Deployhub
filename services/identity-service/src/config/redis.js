import Redis from 'ioredis';
import { env } from '../lib/env.js';
import { createRedisClient } from '../../../../shared/redis/createRedisClient.js';

let redis;

export const connectRedis = async () => {
    redis = createRedisClient({
        Redis,
        logger: console,
        options: {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
            password: env.REDIS_PASSWORD,
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true,
            keepAlive: 10000,
            connectTimeout: 10000,
            retryStrategy: (times) => Math.min(times * 500, 5000),
        },
    });


    redis.on("error", (err) => console.error("Redis error:", err.message));

    try {
        await redis.connect();
    } catch (err) {
        console.error("Redis initial connect failed:", err.message);
    }

    return redis;
};

export const getRedis = () => {

    if (!redis) {
        throw new Error('Redis not Initialised')
    }

    return redis;
}

