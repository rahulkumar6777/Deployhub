import Redis from 'ioredis';
import { envs } from '../lib/env.js';
import { createRedisClient } from '../../../../shared/redis/createRedisClient.js';

let redis;

export const connectRedis = async () => {

    redis = createRedisClient({
        Redis,
        logger: console,
        options: {
            host: envs.REDIS_HOST,
            port: envs.REDIS_PORT,
            password: envs.REDIS_PASSWORD,
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true
        }
    });

    await redis.connect();
    return redis;
}

export const getRedis = () => {

    if (!redis) {
        throw new Error('Redis not Initialised')
    }

    return redis;
}

