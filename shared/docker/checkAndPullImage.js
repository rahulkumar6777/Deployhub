export const checkAndPullImage = async (docker, imageName) => {
    try {
        await docker.getImage(imageName).inspect();
        console.log(`Image already exists: ${imageName}`);
    } catch (err) {
        if (err.statusCode === 404) {
            console.log(`Pulling image: ${imageName}...`);
            await new Promise((resolve, reject) => {
                docker.pull(imageName, (err, stream) => {
                    if (err) return reject(err);
                    docker.modem.followProgress(
                        stream,
                        // onFinished — yahi missing tha
                        (err, output) => {
                            if (err) return reject(err);
                            console.log(`Image pulled: ${imageName}`);
                            resolve();
                        },
                        // onProgress — har layer ka status
                        (event) => {
                            if (event.status) console.log(`[pull] ${event.status} ${event.progress || ""}`);
                        }
                    );
                });
            });
        } else {
            throw err;
        }
    }
};