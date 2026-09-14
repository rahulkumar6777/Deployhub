import express from 'express';
import { projectRateLimitMiddleware } from '../../middlewares/rateLimit.js';
import { checkHealthMiddleware } from '../../middlewares/healthCheck.js';
import { enforceProjectAccessPolicy } from '../../middlewares/projectAccessPolicy.js';
import proxy from '../../proxy/proxy.js';
import { services } from '../../config/services.js';
import { ENV } from '../../lib/env.js';


const router = express.Router({ caseSensitive: true, strict: true });


router.use(
    '/',
    enforceProjectAccessPolicy,
    checkHealthMiddleware('Project'),
    projectRateLimitMiddleware,
    proxy(services.Project.url, 'Project-Service', { internalSecret: ENV.INTERNAL_SECRET }),
);

export default router;
