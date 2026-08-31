import { cacheKey } from '../../../../shared/cache/cacheKey.js';
import { clientIp } from '../../../../shared/utils/clientIp.js';
import { getRedis } from '../config/redis.js';


const limits = {
    Identity: {
        time: 60,
        limit: 10
    },
}

const rateLimit = async (serviceName, req, res, windowSeconds, limit, inputMessage) => {
    const redis = getRedis();
    const requester = req.user?._id || clientIp(req);
    const redisKey = cacheKey.RateLimit(requester, serviceName)

    const count = await redis.incr(redisKey);

    if (count === 1) {
        await redis.expire(redisKey, windowSeconds);
    }

    if (count > limit) {
        res.status(429).json({
            message: inputMessage
        });
        return true;
    }

    return false;
}

export const rateLimitMiddleware = (apiType, inputMessage) => {
    return async (req, res, next) => {
        try {
            const config = limits[apiType];
            if (!config) {
                return next();
            }

            const exceeded = await rateLimit(apiType, req, res, config.time, config.limit, inputMessage);
            if (exceeded) {
                return;
            }
            next();
        } catch (error) {
            next(error);
        }
    }
}
