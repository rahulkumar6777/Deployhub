import express from 'express';
import { registerInitValidate, registerVerifyValidator } from '../validators/register.js';
import { initRegisterController, verifyRegisterController } from '../controllers/register.controller.js';
import { githubCallbackController, githubLoginController } from '../controllers/githubLogin.js';
import { loginValidator } from '../validators/login.js';
import { loginController } from '../controllers/login.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { listSessionsController, revokeSessionController, revokeAllSessionsController } from '../controllers/session.controller.js';
import { refreshTokenController } from '../controllers/RefreshToken.Controller.js';
import { logoutController } from '../controllers/logout.controller.js';


const identityServiceRouter = express.Router();

identityServiceRouter.post('/register/init', registerInitValidate, initRegisterController);
identityServiceRouter.post('/register/verify', registerVerifyValidator, verifyRegisterController);
identityServiceRouter.get('/github', githubLoginController);
identityServiceRouter.get('/github/callback', githubCallbackController);
identityServiceRouter.post('/login', loginValidator, loginController)
identityServiceRouter.get('/sessions', verifyJWT, listSessionsController);
identityServiceRouter.delete('/sessions/:tokenId', verifyJWT, revokeSessionController);
identityServiceRouter.delete('/sessions', verifyJWT, revokeAllSessionsController);
identityServiceRouter.get('/refresh/token', refreshTokenController)
identityServiceRouter.post('/logut' , logoutController)

export default identityServiceRouter;
