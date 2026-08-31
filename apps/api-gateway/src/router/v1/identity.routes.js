import express from 'express'
import { rateLimitMiddleware } from '../../middlewares/rateLimit.js'
import { checkHealthMiddleware } from '../../middlewares/healthCheck.js';
import proxy from '../../proxy/proxy.js';
import { services } from "../../config/services.js"

const router = express.Router();

router.use(
    "/",
    checkHealthMiddleware('Identity'),
    rateLimitMiddleware('Identity', 'To Many Request! Plase try again Later'),
    proxy(services.Identity.url, "Identity-Service")
);


export default router;
