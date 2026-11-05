import express from 'express';
import { getProjectValidator } from '../validators/getProject.validator.js';
import { getProjectController } from '../controllers/getProject.controller.js';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { env } from '../lib/env.js';

const router = express.Router();


router.use(internalApiCallMiddleware({ secret: env.INTERNAL_SERVICE_TALKING_SECRET, header: "x-internal-secret" }));

router.route('/project/:projectId').get(getProjectValidator, getProjectController)


export default router;