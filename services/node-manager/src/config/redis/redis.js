import Redis from "ioredis";
import { createRedisClient } from "../../../../../shared/redis/createRedisClient.js";
import { envs } from "../../lib/env.js";

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

};