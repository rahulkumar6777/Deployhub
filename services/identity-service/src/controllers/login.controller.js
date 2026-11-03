import { validationResult } from 'express-validator';
import { login } from '../services/login.service.js';
import { generateToken } from '../services/session.service.js';
import { getRefreshTokenOptions } from '../utils/cookieOption.js';
import {
    createLoginChallenge,
    sendLoginEmailCode,
    verifyLoginChallenge,
} from '../services/twoFactor.service.js';
import { returnError } from '../../../../shared/errors/sendError.js';


export const loginController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        };

        const user = await login(req.body);
        if (user.twoFactorEnabled && user.provider === 'local') {
            return res.status(200).json(await createLoginChallenge(user));
        }
        const { AccessToken, RefreshToken } = await generateToken(user._id, req);

        return res
            .cookie('RefreshToken', RefreshToken, getRefreshTokenOptions())
            .status(200)
            .json({
                success: true,
                message: 'Login Successful',
                AccessToken
            });

    } catch (error) {
        returnError(res, error);
    }
}

export const sendTwoFactorLoginEmailController = async (req, res) => {
    try {
        const result = await sendLoginEmailCode(req.body?.challengeToken);

        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        returnError(res, error);
    }
};

export const verifyTwoFactorLoginController = async (req, res) => {
    try {
        const user = await verifyLoginChallenge(req.body || {});
        const { AccessToken, RefreshToken } = await generateToken(user._id, req);

        return res
            .cookie('RefreshToken', RefreshToken, getRefreshTokenOptions())
            .status(200)
            .json({
                success: true,
                message: 'Login Successful',
                AccessToken,
            });
    } catch (error) {
        returnError(res, error);
    }
};
