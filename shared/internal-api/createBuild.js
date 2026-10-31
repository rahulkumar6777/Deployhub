export const createBuildExternalApiCall = async (axios, buildServiceUrl, internalServiceSecret, microservicetalkingsecret, data) => {
    try {
        const response = await axios.post(`${buildServiceUrl}/internal/builds`,
            data,
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-internal-secret": internalServiceSecret,
                    "x-microservice-secret": microservicetalkingsecret,
                },
                timeout: 10000,
            })

        return response.data;
    } catch (error) {
        console.error("Create Build Error:", error.response?.data || error.message);
        return null;
    }
}