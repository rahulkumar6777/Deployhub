import { validationResult } from "express-validator";
import { returnError } from "../../../../shared/errors/sendError.js";
import { initRegister, verifyRegister } from "../services/register.service.js";

export const initRegisterController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()[0].msg
            });
        }

        await initRegister(req.body)
        return res.status(200).json({
            success: true,
            message: 'Otp sent successfully'
        });

    } catch (error) {
        console.log('error', error)
        returnError(res, error);
    }
}


export const verifyRegisterController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()[0].msg
            });
        }

        await verifyRegister(req.body)
        return res.status(200).json({
            success: true,
            message: 'Registration successfully'
        });

    } catch (error) {
        returnError(res, error);
    }
}


