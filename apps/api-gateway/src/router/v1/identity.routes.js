import express from 'express'
import { identityRateLimitMiddleware } from '../../middlewares/rateLimit.js'
import { checkHealthMiddleware } from '../../middlewares/healthCheck.js';
import { enforceIdentityAccessPolicy } from '../../middlewares/identityAccessPolicy.js';
import proxy from '../../proxy/proxy.js';
import { services } from "../../config/services.js"
import { ENV } from '../../lib/env.js';

const router = express.Router({ caseSensitive: true, strict: true });

router.use("/", enforceIdentityAccessPolicy, checkHealthMiddleware('Identity'), identityRateLimitMiddleware, proxy(services.Identity.url, "Identity-Service", { internalSecret: ENV.INTERNAL_SECRET, }));


export default router;
