import express from 'express';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { DEPLOY_SERVICE_ENV } from '../lib/env.js';

const router = express.Router();

router.use(internalApiCallMiddleware({ secret: DEPLOY_SERVICE_ENV.INTERNAL_SERVICE_TALKING_SECRET, header: "x-internal-secret" }));



export default router;
