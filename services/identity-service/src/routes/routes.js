import express from 'express';
import { registerInitValidate, registerVerifyValidator } from '../validators/register.js';
import { initRegisterController, verifyRegisterController } from '../controllers/register.controller.js';
import { githubCallbackController, githubLoginController } from '../controllers/githubLogin.js';
import { loginValidator } from '../validators/login.js';
import { loginController, sendTwoFactorLoginEmailController, verifyTwoFactorLoginController, } from '../controllers/login.controller.js';
import { beginTotpSetupController, changeTwoFactorMethodController, disableTwoFactorController, enableEmail2faController, enableTotpController, sendEmailSetupCodeController, twoFactorStatusController, } from '../controllers/twoFactor.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { listSessionsController, revokeSessionController, revokeAllSessionsController } from '../controllers/session.controller.js';
import { refreshTokenController } from '../controllers/RefreshToken.Controller.js';
import { logoutController } from '../controllers/logout.controller.js';
import upload, { handleUploadError } from '../middleware/multer.middleware.js';
import { profilePicValidator } from '../validators/profilePic.js';
import { getUserReposController, userFullNameCOntroller, userMeController, userPasswordController, userProfilePicController } from '../controllers/user.controller.js';
import { userFullNameValidator } from '../validators/user.js';
import { passwordUpdateValidator } from '../validators/password.js';
import { resendOtpValidator } from '../validators/resendOtp.validator.js';
import { resendOtpController } from '../controllers/resendOtp.controller.js';


const identityServiceRouter = express.Router();

identityServiceRouter.post('/register/init', registerInitValidate, initRegisterController);
identityServiceRouter.post('/register/verify', registerVerifyValidator, verifyRegisterController);
identityServiceRouter.get('/github', githubLoginController);
identityServiceRouter.get('/github/callback', githubCallbackController);
identityServiceRouter.post('/login', loginValidator, loginController)
identityServiceRouter.post('/login/2fa/email', sendTwoFactorLoginEmailController);
identityServiceRouter.post('/login/2fa/verify', verifyTwoFactorLoginController);
identityServiceRouter.get('/2fa', verifyJWT, twoFactorStatusController);
identityServiceRouter.post('/2fa/totp/setup', verifyJWT, beginTotpSetupController);
identityServiceRouter.post('/2fa/totp/enable', verifyJWT, enableTotpController);
identityServiceRouter.post('/2fa/email/send', verifyJWT, sendEmailSetupCodeController);
identityServiceRouter.post('/2fa/email/enable', verifyJWT, enableEmail2faController);
identityServiceRouter.put('/2fa/method', verifyJWT, changeTwoFactorMethodController);
identityServiceRouter.delete('/2fa', verifyJWT, disableTwoFactorController);
identityServiceRouter.get('/sessions', verifyJWT, listSessionsController);
identityServiceRouter.delete('/sessions/:tokenId', verifyJWT, revokeSessionController);
identityServiceRouter.delete('/sessions', verifyJWT, revokeAllSessionsController);
identityServiceRouter.get('/refresh/token', refreshTokenController)
identityServiceRouter.post('/logout', logoutController)
identityServiceRouter.put('/user/profile-pic', verifyJWT, upload.single('profilePic'), handleUploadError, profilePicValidator, userProfilePicController);
identityServiceRouter.put('/user/fullname', verifyJWT, userFullNameValidator, userFullNameCOntroller);
identityServiceRouter.put('/user/password', verifyJWT, passwordUpdateValidator, userPasswordController);
identityServiceRouter.get('/user/repos', verifyJWT, getUserReposController);
identityServiceRouter.post('/resendotp', resendOtpValidator, resendOtpController);
identityServiceRouter.get('/user/me', verifyJWT, userMeController)

export default identityServiceRouter;
