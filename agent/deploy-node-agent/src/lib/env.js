const requiredEnvs = [
    "NODE_ENV",
    "PORT",
    "NODE_ID",
    "NODE_SECRET",
    "NODE_MANAGER_URL",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_PASSWORD"
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
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
}