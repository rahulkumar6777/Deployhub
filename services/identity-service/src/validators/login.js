import { body } from 'express-validator';

export const loginValidator = [
    body('email')
        .notEmpty()
        .withMessage('email is required')
        .isEmail()
        .normalizeEmail()
        .withMessage("Invalid Email")
        .isString()
        .withMessage('Invalid EMail Type'),
    body('password')
        .notEmpty()
        .withMessage('password is required')
        .isString()
        .withMessage("Invalid password type")
]