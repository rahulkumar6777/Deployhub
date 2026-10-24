import dotenv from 'dotenv';
dotenv.config();

const requiredEnvs = [
    "NODE_ENV",
    "PORT"
];

for (const key of requiredEnvs) {
    if (!process.env[key]) {
        throw new Error(`Missing Env: ${key}`);
    }
}

export const envs = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT
}