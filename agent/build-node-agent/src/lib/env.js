const requiredEnvs = [
    "NODE_ENV",
    "PORT",
    "NODE_ID",
    "NODE_SECRET",
    "NODE_MANAGER_URL",
    "RABBIT_MQ_URL",
    "DOMAINDROP_API_KEY",
    "DOMAINDROP_SPACE_ID",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_PASSWORD",
    "IDENTITY_SERVICE_URL",
    "PROJECT_SERVICE_URL", 
    "BUILD_SERVICE_URL",
    "DOCKER_USERNAME",
    "DOCKER_PASSWORD",
    "INTERNAL_SERVICE_TALKING_SECRET",
    "INTERNAL_SECRET"
];
for (const key of requiredEnvs) {
    if (!process.env[key]) {
        throw new Error(`Missing Env: ${key}`);
    }
}


export const envs = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    NODE_ID: process.env.NODE_ID,
    NODE_SECRET: process.env.NODE_SECRET,
    NODE_MANAGER_URL: process.env.NODE_MANAGER_URL,
    RABBIT_MQ_URL: process.env.RABBIT_MQ_URL,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_TLS: process.env.REDIS_TLS === "true",
    DOMAINDROP_API_KEY: process.env.DOMAINDROP_API_KEY,
    DOMAINDROP_SPACE_ID: process.env.DOMAINDROP_SPACE_ID,
    IDENTITY_SERVICE_URL: process.env.IDENTITY_SERVICE_URL,
    PROJECT_SERVICE_URL: process.env.PROJECT_SERVICE_URL,
    BUILD_SERVICE_URL: process.env.BUILD_SERVICE_URL,
    DOCKER_USERNAME: process.env.DOCKER_USERNAME,
    DOCKER_PASSWORD: process.env.DOCKER_PASSWORD,
    INTERNAL_SERVICE_TALKING_SECRET: process.env.INTERNAL_SERVICE_TALKING_SECRET,
    INTERNAL_SECRET: process.env.INTERNAL_SECRET
}
