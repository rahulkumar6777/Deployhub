import { createHash } from 'node:crypto';
import { resolveIdentityRoutePath } from './identityAccessPolicy.js';

let configuredRedisProvider = () => {
    throw new Error('Rate-limit Redis provider is not configured');
};

export const configureRateLimitRedisProvider = (provider) => {
    if (typeof provider !== 'function') {
        throw new TypeError('Rate-limit Redis provider must be a function');
    }
    configuredRedisProvider = provider;
};

const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('TTL', KEYS[1])
if count == 1 or ttl < 0 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return { count, ttl }
`;

const policy = (name, windowSeconds, limit, subject) =>
    Object.freeze({ name, windowSeconds, limit, subject });

const clientIp = (req) => {
    let value = String(req.ip || req.socket?.remoteAddress || 'unknown').trim();
    if (value.startsWith('::ffff:')) value = value.slice(7);
    return value.slice(0, 128);
};

const email = (req) => {
    if (typeof req.body?.email !== 'string') return null;
    const value = req.body.email.trim().toLowerCase();
    return value ? value.slice(0, 320) : null;
};

export const INGRESS_POLICY = policy('gateway:ingress', 60, 120, (req) => `ip:${clientIp(req)}`);

const IDENTITY_POLICIES = Object.freeze({
    'GET /health': [
        policy('identity:health:ip', 60, 10, (req) => `ip:${clientIp(req)}`),
    ],
    'POST /register/init': [
        policy('identity:register-init:ip', 15 * 60, 10, (req) => `ip:${clientIp(req)}`),
        policy('identity:register-init:email', 15 * 60, 3, (req) => {
            const value = email(req);
            return value ? `email:${value}` : null;
        }),
    ],
    'POST /register/verify': [
        policy('identity:register-verify:ip', 10 * 60, 20, (req) => `ip:${clientIp(req)}`),
        policy('identity:register-verify:email', 10 * 60, 10, (req) => {
            const value = email(req);
            return value ? `email:${value}` : null;
        }),
    ],
    'GET /github': [
        policy('identity:github-start:ip', 5 * 60, 30, (req) => `ip:${clientIp(req)}`),
    ],
    'GET /github/callback': [
        policy('identity:github-callback:ip', 5 * 60, 30, (req) => `ip:${clientIp(req)}`),
    ],
    'POST /login': [
        policy('identity:login:ip', 5 * 60, 30, (req) => `ip:${clientIp(req)}`),
        policy('identity:login:email', 5 * 60, 10, (req) => {
            const value = email(req);
            return value ? `email:${value}` : null;
        }),
    ],
    'GET /sessions': [
        policy('identity:sessions-list:ip', 5 * 60, 30, (req) => `ip:${clientIp(req)}`),
    ],
    'DELETE /sessions': [
        policy('identity:sessions-revoke-all:ip', 5 * 60, 30, (req) => `ip:${clientIp(req)}`),
    ],
    'DELETE /sessions/:tokenId': [
        policy('identity:sessions-revoke:ip', 5 * 60, 30, (req) => `ip:${clientIp(req)}`),
    ],
    'GET /refresh/token': [
        policy('identity:refresh:token:ip', 60, 60, (req) => `ip:${clientIp(req)}`)
    ],
    'POST /logout': [
        policy('identity:logout:ip', 5 * 60, 30, (req) => `ip:${clientIp(req)}`)
    ],
    'PUT /user/profile-pic': [
        policy(':users:profile-pic:ip', 5 * 60, 60, (req) => `ip:${clientIp(req)}`)
    ],
    'PUT /user/fullname': [
        policy(':users:fullname:ip', 5 * 60, 60, (req) => `ip:${clientIp(req)}`)
    ]
});

export const resolveIdentityPolicies = (req) =>
    IDENTITY_POLICIES[`${req.method} ${resolveIdentityRoutePath(req.path)}`] || [];

const redisKey = (policyName, subject) => {
    const digest = createHash('sha256').update(subject).digest('hex');
    return `deployhub:rate-limit:${policyName}:${digest}`;
};

const consume = async (redis, selectedPolicy, req) => {
    const subject = selectedPolicy.subject(req);
    if (!subject) return null;

    const result = await redis.eval(
        RATE_LIMIT_SCRIPT,
        1,
        redisKey(selectedPolicy.name, subject),
        selectedPolicy.windowSeconds,
    );

    const count = Number(result?.[0]);
    const ttl = Math.max(1, Number(result?.[1]) || selectedPolicy.windowSeconds);
    if (!Number.isFinite(count)) {
        throw new Error('Redis returned an invalid rate-limit result');
    }

    return { count, ttl };
};

export const createRateLimitMiddleware = (
    resolvePolicies,
    { redisProvider = () => configuredRedisProvider(), message = 'Too many requests. Please try again later.' } = {},
) => async (req, res, next) => {
    try {
        const selectedPolicies = typeof resolvePolicies === 'function'
            ? resolvePolicies(req)
            : resolvePolicies;
        const redis = redisProvider();

        for (const selectedPolicy of selectedPolicies) {
            const usage = await consume(redis, selectedPolicy, req);
            if (usage && usage.count > selectedPolicy.limit) {
                res.setHeader('Retry-After', String(usage.ttl));
                res.setHeader('Cache-Control', 'no-store');
                return res.status(429).json({
                    success: false,
                    message,
                    traceId: req.traceId,
                });
            }
        }

        next();
    } catch (error) {
        console.log(error)
        error.code = error.code || 'RATE_LIMIT_UNAVAILABLE';
        next(error);
    }
};

export const ingressRateLimitMiddleware = createRateLimitMiddleware([INGRESS_POLICY]);
export const identityRateLimitMiddleware = createRateLimitMiddleware(resolveIdentityPolicies);
