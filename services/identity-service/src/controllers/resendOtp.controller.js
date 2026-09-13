import { validationResult } from "express-validator";
import { returnError } from "../../../../shared/errors/sendError.js";
import { resendOtp } from "../services/resendOtp.service.js";

export const resendOtpController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        }
        const { type, email } = req.body

        await resendOtp(type, email);

        return res.status(200).json({
            message: "otp sent successfully"
        })
    } catch (error) {
        console.log(error)
        returnError(res, error)
    }
}