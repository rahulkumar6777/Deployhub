import express from "express";
import helmet from "helmet";


export const buildApp = () => {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));


    app.use(helmet());
    
    app.get("/health", async (_req, res) => {
        res.status(200).json({
            status: "ok",
            service: "node-manager"
        });
    });

    return app;
}