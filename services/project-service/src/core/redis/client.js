import Redis from 'ioredis';
import { env } from '../../lib/env.js'
import { createRedisClient } from '../../../../../shared/redis/createRedisClient.js';

let redis;

export const connectRedis = async () => {

    redis = createRedisClient({
        Redis,
        logger: console,
        options: {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
            password: env.REDIS_PASSWORD,
            ...(env.REDIS_TLS ? { tls: {} } : {}),
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true
        }
    })

    await redis.connect();
    return redis;
}

export const getRedis = () => {

    if (!redis) {
        throw new Error('Redis not Initialised')
    }

    return redis;
}

export const closeRedis = async () => {
    const client = redis;
    redis = undefined;
    if (!client) return;

    try {
        await client.quit();
    } catch {
        client.disconnect();
    }
}