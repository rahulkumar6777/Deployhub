export const getUserGithubAccessToken = async (axios, identityServiceUrl, userId, microservicetalkingsecret, internalServiceSecret) => {
    try {

        const response = await axios.get(`${identityServiceUrl}/internal/users/${userId}/github-access-token`,
            {
                headers: {
                    content: "application/json",
                    'x-microservice-secret': microservicetalkingsecret,
                    'x-internal-secret': internalServiceSecret,
                }
            }
        );

        return response.data.accessToken;

    } catch (error) {
        console.error("Error fetching GitHub access token:", error);
        return null;
    }
}