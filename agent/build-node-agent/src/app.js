import express from 'express';
import { loadSecrets } from "./config/secretsloader.js";

export const buildApp = async () => {

    const app = express();

    // load secrets
    await loadSecrets();

    app.get('/health', (_req, res) => {
        return res.status(200).json({
            success: true,
            service: "build-node-agent"
        })

    });

    return app;
}