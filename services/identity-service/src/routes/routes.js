import express from 'express';
import { registerInitValidate, registerVerifyValidator } from '../validators/register.js';
import { initRegisterController, verifyRegisterController } from '../controllers/register.controller.js';


const identityServiceRouter = express.Router();

identityServiceRouter.post('/register/init', registerInitValidate, initRegisterController);
identityServiceRouter.post('/register/verify', registerVerifyValidator, verifyRegisterController);


export default identityServiceRouter;
