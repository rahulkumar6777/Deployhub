import express from 'express';
import { internalApiCallMiddleware } from '../../../../shared/middlewares/interalApiCall.js';
import { env } from '../lib/env.js';
import { getUserNetworkNameController, githubAccessTokenController } from '../controllers/user.controller.js';


const internalRouter = express.Router({
    strict: true,
    caseSensitive: true
});


const internal = internalApiCallMiddleware({ secret: env.INTERNAL_SERVICE_TALKING_SECRET });
internalRouter.use(internal);


internalRouter.get('/users/:userId/github-access-token', githubAccessTokenController);


export default internalRouter;

