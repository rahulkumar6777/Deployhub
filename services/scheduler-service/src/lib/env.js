const requiredEnvs = [
    "NODE_ENV",
    "PORT",
    "NODE_MANAGER_URL",
    "RABBIT_MQ_URL",
];


for (const key of requiredEnvs) {
    if (!process.env[key]) {
        throw new Error(`Missing Env: ${key}`);
    };
};


export const envs = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    NODE_MANAGER_URL: process.env.NODE_MANAGER_URL,
    RABBIT_MQ_URL: process.env.RABBIT_MQ_URL
};