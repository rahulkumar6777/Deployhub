import express from 'express';
import { registerInitValidate, registerVerifyValidator } from '../validators/register.js';
import { initRegisterController, verifyRegisterController } from '../controllers/register.controller.js';
import { githubCallbackController, githubLoginController } from '../controllers/githubLogin.js';


const identityServiceRouter = express.Router();

identityServiceRouter.post('/register/init', registerInitValidate, initRegisterController);
identityServiceRouter.post('/register/verify', registerVerifyValidator, verifyRegisterController);
identityServiceRouter.get('/github', githubLoginController);
identityServiceRouter.get('/github/callback', githubCallbackController);

export default identityServiceRouter;
