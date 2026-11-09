async function getDockerHubJwt(axios, dockerHubUsername, dockerHubToken) {
    const authRes = await axios.post(
        "https://hub.docker.com/v2/users/login/",
        {
            username: dockerHubUsername,
            password: dockerHubToken,
        },
        {
            headers: { "Content-Type": "application/json" },
        }
    );
    return authRes.data.token;
}

export const deleteDockerHubImage = async (imageName, dockerHubToken, dockerHubUsername, axios, docker) => {


    try {
        const image = docker.getImage(imageName);
        await image.inspect();
        await image.remove({ force: true });
    } catch (error) {
        if (error.statusCode !== 404) {
            console.error("Local image delete failed:", error.message);
        }
    }


    const [repoPath, tag = "latest"] = imageName.split(":");
    const firstSlash = repoPath.indexOf("/");

    if (firstSlash === -1) {
        throw new Error("Invalid image name format");
    }

    const username = repoPath.slice(0, firstSlash);
    const repository = repoPath.slice(firstSlash + 1);


    let jwt;
    try {
        jwt = await getDockerHubJwt(axios, dockerHubUsername, dockerHubToken);
    } catch (error) {
        console.error("Docker Hub auth failed:", error.response?.data || error.message);
        return { success: false, imageName, error: "auth_failed" };
    }


    try {
        await axios.delete(
            `https://hub.docker.com/v2/repositories/${username}/${repository}/tags/${tag}/`,
            {
                headers: {
                    Authorization: `JWT ${jwt}`,
                },
            }
        );
    } catch (error) {
        if (error.response?.status === 404) {
            return {
                success: true, imageName, hub: "not_found"
            };
        }
        console.error("Hub image delete failed:", error.response?.data || error.message);
        return {
            success: false, imageName, error: "hub_delete_failed"
        };
    }

    return { success: true, imageName };
};

export const deleteDockerHubRepository = async ({
    repository,
    dockerHubToken,
    dockerHubUsername,
    axios,
    docker,
}) => {
    const repoName = String(repository).toLowerCase();
    const fullRepo = `${dockerHubUsername}/${repoName}`;

    try {
        const images = await docker.listImages({ all: true });
        for (const img of images) {
            const tags = img.RepoTags || [];
            const matches = tags.some((tag) => tag === fullRepo || tag.startsWith(`${fullRepo}:`));
            if (!matches) continue;

            try {
                await docker.getImage(img.Id).remove({ force: true });
            } catch (error) {
                if (error.statusCode !== 404) {
                    console.error(`[docker] Local image remove failed (${img.Id}):`, error.message);
                }
            }
        }
    } catch (error) {
        console.error(`[docker] Failed listing local images for ${fullRepo}:`, error.message);
    }

    let jwt;
    try {
        jwt = await getDockerHubJwt(axios, dockerHubUsername, dockerHubToken);
    } catch (error) {
        console.error("Docker Hub auth failed:", error.response?.data || error.message);
        return { success: false, repository: fullRepo, error: "auth_failed" };
    }

    try {
        await axios.delete(
            `https://hub.docker.com/v2/repositories/${dockerHubUsername}/${repoName}/`,
            {
                headers: {
                    Authorization: `JWT ${jwt}`,
                },
            }
        );
    } catch (error) {
        if (error.response?.status === 404) {
            return { success: true, repository: fullRepo, hub: "not_found" };
        }
        console.error("Hub repository delete failed:", error.response?.data || error.message);
        return { success: false, repository: fullRepo, error: "hub_repo_delete_failed" };
    }

    return { success: true, repository: fullRepo };
};