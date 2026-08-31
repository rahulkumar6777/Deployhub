export const cacheKey = {
    RateLimit: (requester, serviceName) => `deployhub:RateLimit:${requester}:service:${serviceName}`,
    deleteProjectSchedule: () => `deployhub:users:project:delete:schedule`
}