import { body } from "express-validator";

export const resendOtpValidator = [
    body('email')
        .notEmpty()
        .withMessage("email is required")
        .isString()
        .withMessage("email Must be a String")
        .isLength({ max: 256 })
        .withMessage("Email Length must be under 256charater"),
    body('type')
        .notEmpty()
        .withMessage("type is required")
]