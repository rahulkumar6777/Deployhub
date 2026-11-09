export const pushDockerImage =
  async ({
    docker,
    imageName,
    username,
    password,
  }) => {

    const image =
      docker.getImage(imageName);

    return image.push({
      authconfig: {
        username,
        password,
      },
    });
  };