export const cacheKey = {
    RateLimit: (requester, serviceName) => `deployhub:RateLimit:${requester}:service:${serviceName}`,
    UserOtp: (email) => `deployhub:users:otp:${email}`,
    deleteProjectSchedule: () => `deployhub:users:project:delete:schedule`
}