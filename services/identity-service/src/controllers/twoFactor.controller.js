import { returnError } from '../../../../shared/errors/sendError.js';
import { beginTotpSetup, changeTwoFactorMethod, disableTwoFactor, enableEmail2fa, enableTotp, sendEmailSetupCode, twoFactorStatus, } from '../services/twoFactor.service.js';


export const twoFactorStatusController = async (req, res) => {
    try {
        const status = await twoFactorStatus(req.user._id);

        return res.status(200).json({
            success: true,
            ...status,
        });
    } catch (error) {
        returnError(res, error);
    }
};


export const beginTotpSetupController = async (req, res) => {
    try {
        const setup = await beginTotpSetup(req.user._id);

        return res.status(200).json({
            success: true,
            ...setup,
        });
    } catch (error) {
        returnError(res, error);
    }
};


export const enableTotpController = async (req, res) => {
    try {
        const result = await enableTotp(req.user._id, req.body?.code);

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        returnError(res, error);
    }
};


export const sendEmailSetupCodeController = async (req, res) => {
    try {
        await sendEmailSetupCode(req.user._id);

        return res.status(200).json({
            success: true,
            message: 'Verification code sent',
        });
    } catch (error) {
        returnError(res, error);
    }
};


export const enableEmail2faController = async (req, res) => {
    try {
        const result = await enableEmail2fa(req.user._id, req.body?.code);

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        returnError(res, error);
    }
};


export const changeTwoFactorMethodController = async (req, res) => {
    try {
        const result = await changeTwoFactorMethod(
            req.user._id,
            req.body?.method
        );

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        returnError(res, error);
    }
};


export const disableTwoFactorController = async (req, res) => {
    try {
        const result = await disableTwoFactor(req.user._id);

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        returnError(res, error);
    }
};
