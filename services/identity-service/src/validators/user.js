import { body } from "express-validator";

export const userFullNameValidator = [
    body('fullname')
        .notEmpty()
        .withMessage('fullname is required')
        .isString()
        .withMessage('fullname must be a string')
]