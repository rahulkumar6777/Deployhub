import { body } from 'express-validator';


export const registerInitValidate = [
    body('fullName').notEmpty().withMessage("Fullname is Required").isString(),
    body('email')
        .notEmpty()
        .withMessage("email is Required")
        .isEmail()
        .normalizeEmail()
        .withMessage("Invalid Email Formet"),
    body('password')
        .notEmpty()
        .withMessage("Password is Required")
        .isString()
        .isLength({ min: 8 })
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        )
        .withMessage(
            "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
        ),
]


export const registerVerifyValidator = [
    body("email")
        .notEmpty()
        .withMessage("email is required")
        .isEmail()
        .normalizeEmail()
        .withMessage("Invalid Email Formet"),
    body("otp")
        .notEmpty()
        .withMessage("otp is required")
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage("Otp Length is 6 and should be number"),
]
