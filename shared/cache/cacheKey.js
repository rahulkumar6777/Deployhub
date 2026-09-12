export const cacheKey = {
    RateLimit: (requester, serviceName) => `deployhub:RateLimit:${requester}:service:${serviceName}`,
    UserOtp: (email) => `deployhub:users:otp:${email}`,
    createGithubOAuthStateKey: (state) => `deployhub:githubOAuthState:${state}`,
    createSessionKey: (userId, tokenId) => `deployhub:users:${userId}:session:${tokenId}`,
    deleteProjectSchedule: () => `deployhub:users:project:delete:schedule`,
    createRefreshRotationKey: (userId, tokenId) => `deployhub:refreshRotation:${userId}:${tokenId}`,
    createRefreshLockKey: (userId, tokenId) => `deployhub:refreshLock:${userId}:${tokenId}`
}