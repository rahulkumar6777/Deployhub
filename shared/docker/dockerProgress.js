export const dockerProgress = (
    docker,
    stream,
    logger
) => {

    return new Promise((resolve, reject) => {

        docker.modem.followProgress(
            stream,
            (err, res) =>
                err ? reject(err) : resolve(res),

            (event) => {

                if (event.stream) {
                    process.stdout.write(event.stream);

                    logger?.write(event.stream);
                }

                if (event.error) {
                    logger?.write(
                        `[ERROR] ${event.error}`
                    );

                    reject(
                        new Error(event.error)
                    );
                }
            }
        );
    });
};