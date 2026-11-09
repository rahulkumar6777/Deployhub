export const activateBuildInternalApiCall = async (
    axios,
    buildServiceUrl,
    internalServiceSecret,
    microservicetalkingsecret,
    buildId,
    data,
) => {
    try {
        const response = await axios.patch(
            `${buildServiceUrl}/internal/builds/${buildId}/activate`,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-secret': internalServiceSecret,
                    'x-microservice-secret': microservicetalkingsecret,
                },
                timeout: 10000,
            },
        );
        return response.data;
    } catch (error) {
        console.error('Activate Build Error:', error.response?.data || error.message);
        return null;
    }
};
