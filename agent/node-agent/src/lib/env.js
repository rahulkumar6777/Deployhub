import dotenv from 'dotenv';
dotenv.config();


const requiredEnvs = [
    "NODE_ENV",
    "PORT",
    "NODE_ID",
    "NODE_SECRET",
    "NODE_MANAGER_URL",
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
}