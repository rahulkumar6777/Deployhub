export const createRedisClient = ({ Redis, options, logger = console }) => {
    const client = new Redis({
        ...options,
        maxRetriesPerRequest: options.maxRetriesPerRequest ?? 3,
        enableReadyCheck: options.enableReadyCheck ?? true,
        lazyConnect: options.lazyConnect ?? true,
    });

    client.on('connect', () => {
        logger.info?.('Redis connected');
    });

    client.on('error', (err) => {
        logger.error?.('Redis error', { err: err.message });
    });

    client.on('reconnecting', () => {
        logger.warn?.('Redis reconnecting');
    });

    return client;
};
