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
    }

    return registry[serviceName] ?? null;
}

export function getRegisteredServices() {
    return [
        'api-gateway',
    ];
}