import { parseTrustedProxyCidrs } from '../config/trustProxy.js';

const required = (key) => {
    const value = process.env[key]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

const positiveInteger = (key, { min = 1, max = 65535 } = {}) => {
    const raw = required(key);
    const value = Number(raw);

    if (!Number.isInteger(value) || value < min || value > max) {
        throw new Error(`${key} must be an integer between ${min} and ${max}`);
    }

    return value;
};

const httpUrl = (key, { optional = false } = {}) => {
    const raw = process.env[key]?.trim();
    if (!raw && optional) return undefined;
    if (!raw) throw new Error(`Missing required environment variable: ${key}`);

    let parsed;
    try {
        parsed = new URL(raw);
    } catch {
        throw new Error(`${key} must be a valid URL`);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`${key} must use http or https`);
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) {
        throw new Error(`${key} must not include credentials, a query, or a fragment`);
    }

    return parsed.href.replace(/\/$/, '');
};

const origin = (key, { optional = false, fallback } = {}) => {
    const raw = process.env[key]?.trim() || fallback;
    if (!raw && optional) return undefined;
    if (!raw) throw new Error(`Missing required environment variable: ${key}`);

    let parsed;
    try {
        parsed = new URL(raw);
    } catch {
        throw new Error(`${key} must be a valid URL origin`);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`${key} must use http or https`);
    }
    if (parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
        throw new Error(`${key} must contain only an origin, for example https://app.example.com`);
    }

    return parsed.origin;
};

const nodeEnv = required('NODE_ENV');
if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, production, or test');
}

const internalSecret = required('INTERNAL_SECRET');
if (internalSecret.length < 32) {
    throw new Error('INTERNAL_SECRET must be at least 32 characters');
}
if (/[\r\n]/.test(internalSecret)) {
    throw new Error('INTERNAL_SECRET contains invalid control characters');
}

const frontendUri = origin('FRONTEND_URL');
const adminFrontendUrl = origin('ADMIN_FRONTEND_URL', {
    optional: nodeEnv === 'production',
    fallback: nodeEnv === 'production' ? undefined : 'http://localhost:5174',
});

if (nodeEnv === 'production') {
    if (!frontendUri.startsWith('https://')) {
        throw new Error('FRONTEND_URL must use HTTPS in production');
    }
    if (adminFrontendUrl && !adminFrontendUrl.startsWith('https://')) {
        throw new Error('ADMIN_FRONTEND_URL must use HTTPS in production');
    }
}

export const ENV = Object.freeze({
    NODE_ENV: nodeEnv,
    PORT: positiveInteger('PORT'),
    FRONTEND_URI: frontendUri,
    ADMIN_FRONTEND_URL: adminFrontendUrl,
    TRUST_PROXY: parseTrustedProxyCidrs(process.env.TRUSTED_PROXY_CIDRS),
    REDIS_HOST: required('REDIS_HOST'),
    REDIS_PORT: positiveInteger('REDIS_PORT'),
    REDIS_PASSWORD: required('REDIS_PASSWORD'),
    REDIS_TLS: process.env.REDIS_TLS?.toLowerCase() === 'true',
    SERVICES_URL: Object.freeze({
        IDENTITY: httpUrl('IDENTITY_SERVICE_URL'),
    }),
    INTERNAL_SECRET: internalSecret,
    SERVICE_NAME: 'api-gateway',
    EMAIL_PASS: required('EMAIL_PASS'),
    EMAIL_USER: required('EMAIL_USER'),
    EMAIL_HOST: required('EMAIL_HOST'),
    EMAIL_PORT: positiveInteger('EMAIL_PORT'),
});
