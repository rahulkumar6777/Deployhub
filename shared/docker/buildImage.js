export const buildDockerImage = async ({
    docker,
    buildContext,
    imageName,
    dockerFile,
    buildArgs,
}) => {

    return docker.buildImage(
        buildContext,
        {
            t: imageName,
            dockerfile: dockerFile,
            nocache: true,
            buildargs: buildArgs,
        }
    );
};