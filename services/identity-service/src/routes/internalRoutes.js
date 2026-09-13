import express from 'express';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { env } from '../lib/env.js';


const internalRouter = express.Router({
    strict: true,
    caseSensitive: true
});


const internal = internalApiCallMiddleware({ secret: env.INTERNAL_SERVICE_TALKING_SECRET });
internalRouter.use(internal);

export default internalRouter;

