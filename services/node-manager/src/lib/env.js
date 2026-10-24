import dotenv from 'dotenv';
dotenv.config();


const requiredEnvs = [
    "NODE_ENV",
    "PORT",
    "MONGODB_URI",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_PASSWORD",
];
for (const key of requiredEnvs) {
    if (!process.env[key]) {
        throw new Error(`Missing Env: ${key}`);
    }
}


export const envs = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
}