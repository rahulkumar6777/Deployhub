import { env } from "../lib/env.js";

export const getSecretsForService = async (serviceName) => {
    const registry = {
        'api-gateway': {
            NODE_ENV: env.NODE_ENV,
            PORT: env.API_GATEWAY_PORT,
            REDIS_HOST: env.REDIS_HOST,
            REDIS_PORT: env.REDIS_PORT,
            REDIS_PASSWORD: env.REDIS_PASSWORD,
            IDENTITY_SERVICE_URL: env.IDENTITY_SERVICE_URL || '',
            PROJECT_SERVICE_URL: env.PROJECT_SERVICE_URL || '',
            BUILD_SERVICE_URL: env.BUILD_SERVICE_URL,
            DEPLOY_SERVICE_URL: env.DEPLOY_SERVICE_URL,
            MONITORING_SERVICE_URL: env.MONITORING_SERVICE_URL || '',
            ANALYTICS_SERVICE_URL: env.ANALYTICS_SERVICE_URL,
            ADMIN_SERVICE_URL: env.ADMIN_SERVICE_URL,
            AGENT_SERVICE_URL: env.AGENT_SERVICE_URL,
            INTERNAL_SECRET: env.INTERNAL_SECRET,
            FRONTEND_URL: env.FRONTEND_URL,
            ADMIN_FRONTEND_URL: env.ADMIN_FRONTEND_URL,
            ACCESS_TOKEN_SECRET: env.ACCESS_TOKEN_SECRET,
            ACCESS_TOKEN_EXPIRY: env.ACCESS_TOKEN_EXPIRY,
            EMAIL_PASS: env.EMAIL_PASS,
            EMAIL_USER: env.EMAIL_USER,
            EMAIL_HOST: env.EMAIL_HOST,
            EMAIL_PORT: String(env.EMAIL_PORT),
        },
        'identity-service': {
            NODE_ENV: env.NODE_ENV,
            PORT: env.IDENTITY_SERVICE_PORT,
            MONGODB_URI: env.IDENTITY_SERVICE_MONGODB_URI,
            REDIS_HOST: env.REDIS_HOST,
            REDIS_PORT: env.REDIS_PORT,
            REDIS_PASSWORD: env.REDIS_PASSWORD,
            ACCESS_TOKEN_SECRET: env.ACCESS_TOKEN_SECRET,
            ACCESS_TOKEN_EXPIRY: env.ACCESS_TOKEN_EXPIRY,
            REFRESH_TOKEN_SECRET: env.REFRESH_TOKEN_SECRET,
            REFRESH_TOKEN_EXPIRY: env.REFRESH_TOKEN_EXPIRY,
            GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
            GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
            GITHUB_TOKEN_ENCRYPTION_KEY: env.GITHUB_TOKEN_ENCRYPTION_KEY,
            EMAIL_HOST: env.EMAIL_HOST,
            EMAIL_PORT: String(env.EMAIL_PORT),
            EMAIL_USER: env.EMAIL_USER,
            EMAIL_PASS: env.EMAIL_PASS,
            INTERNAL_SECRET: env.INTERNAL_SECRET,
            DOMAINDROP_API_KEY: env.DOMAINDROP_API_KEY || '',
            DOMAINDROP_SPACE_ID: env.DOMAINDROP_SPACE_ID || '',
            FRONTEND_URL: env.FRONTEND_URL,
            INTERNAL_SERVICE_TALKING_SECRET: env.INTERNAL_SERVICE_TALKING_SECRET,
            BCRYPT_ROUNDS: env.BCRYPT_ROUNDS
        },
    }

    return registry[serviceName] ?? null;
}

export function getRegisteredServices() {
    return [
        'api-gateway',
    ];
}