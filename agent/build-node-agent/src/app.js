import express from 'express';


export const buildApp = async () => {

    const app = express();

    app.get('/health', (_req, res) => {
        return res.status(200).json({
            success: true,
            service: "build-node-agent"
        })

    });

    return app;
}