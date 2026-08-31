export const createShutdownHandler = ({ server, logger, closeResources = [], timeout = 20000 }) => {
    return async (signal) => {
        logger.warn(`${signal} received — shutting down gracefully`);

        server.close(async () => {
            logger.info("HTTP server closed");


            await Promise.allSettled(closeResources.map(fn => fn()));

            process.exit(0);
        });


        setTimeout(() => {
            logger.error("Forced shutdown after timeout");
            process.exit(1);
        }, timeout);
    };
};