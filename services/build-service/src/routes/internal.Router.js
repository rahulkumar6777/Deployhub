import express from 'express';
import { createBuildValidator } from '../validators/createBuild.validator.js';
import { createBuildController } from '../controllers/createBuild.controller.js';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { buildEnv } from '../lib/env.js';

const router = express.Router();

router.use(internalApiCallMiddleware({ secret: buildEnv.INTERNAL_SERVICE_TALKING_SECRET, header: "x-internal-secret" }));
router.post("/builds" , createBuildValidator, createBuildController );


export default router;