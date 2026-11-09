export const dockerProgress = (
    docker,
    stream,
    logger
) => {

    return new Promise((resolve, reject) => {
        let pendingLogWrites = Promise.resolve();
        let progressError = null;

        docker.modem.followProgress(
            stream,
            async (err, res) => {
                try {
                    await pendingLogWrites;
                } catch (logError) {
                    reject(logError);
                    return;
                }

                if (err || progressError) {
                    reject(err || progressError);
                    return;
                }

                resolve(res);
            },

            (event) => {

                if (event.stream) {
                    process.stdout.write(event.stream);
                    if (logger) {
                        pendingLogWrites = pendingLogWrites.then(() => logger.write(event.stream));
                    }
                }

                if (event.error) {
                    progressError = new Error(event.error);
                    if (logger) {
                        pendingLogWrites = pendingLogWrites.then(() => logger.writeLine(`[ERROR] ${event.error}`));
                    }
                }
            }
        );
    });
};
