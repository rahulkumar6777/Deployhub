const requiredEnv = [
    'NODE_ENV',
    'PORT',
    'FRONTEND_URL',
    'REDIS_PORT', 'REDIS_HOST', 'REDIS_PASSWORD',
    'ACCESS_TOKEN_SECRET', 'ACCESS_TOKEN_EXPIRY',
    'INTERNAL_SECRET',
    'APIGATEWAY_SERVICE_NAME',
    'IDENTITY_SERVICE_URL', 'PROJECT_SERVICE_URL', 'MONITORING_SERVICE_URL', 'ANALYTICS_SERVICE_URL',
    'BUILD_SERVICE_URL', 'DEPLOY_SERVICE_URL',
    'ADMIN_SERVICE_URL', 'AGENT_SERVICE_URL',
    'EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_PORT']

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`missing env${key}`)
    }
};

export const ENV = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    FRONTEND_URI: process.env.FRONTEND_URL,
    ADMIN_FRONTEND_URL: process.env.ADMIN_FRONTEND_URL || 'http://localhost:5174',
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    SERVICES_URL: {
        IDENTITY: process.env.IDENTITY_SERVICE_URL,
        PROJECT: process.env.PROJECT_SERVICE_URL,
        BUILD: process.env.BUILD_SERVICE_URL,
        DEPLOY: process.env.DEPLOY_SERVICE_URL,
        MONITORING: process.env.MONITORING_SERVICE_URL,
        ANALYTICS: process.env.ANALYTICS_SERVICE_URL,
        ADMIN: process.env.ADMIN_SERVICE_URL,
        AGENT: process.env.AGENT_SERVICE_URL,
    },
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
    INTERNAL_SECRET: process.env.INTERNAL_SECRET,
    SERVICE_NAME: process.env.APIGATEWAY_SERVICE_NAME,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
}
