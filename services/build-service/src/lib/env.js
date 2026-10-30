const required = [
    'NODE_ENV', 'PORT',
    "MONGODB_URI",
    'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD',
    'RABBITMQ_URL',
    'INTERNAL_SECRET',
    'INTERNAL_SERVICE_TALKING_SECRET',
    'PROJECT_SERVICE_URL', 'IDENTITY_SERVICE_URL'
]

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing Env: ${key}`);
    }
};

export const buildEnv = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    INTERNAL_SECRET: process.env.INTERNAL_SECRET,
    RABBITMQ_URL: process.env.RABBITMQ_URL,
    INTERNAL_SERVICE_TALKING_SECRET: process.env.INTERNAL_SERVICE_TALKING_SECRET,
    SERVICE_NAME: process.env.BUILD_SERVICE_NAME,
    PROJECT_SERVICE_URL: process.env.PROJECT_SERVICE_URL,
    IDENTITY_SERVICE_URL: process.env.IDENTITY_SERVICE_URL,
}
