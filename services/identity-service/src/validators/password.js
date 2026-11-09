import { body } from 'express-validator';

export const passwordUpdateValidator = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required')
        .isString()
        .withMessage('Current password must be a string'),
    body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .isString()
        .withMessage('New password must be a string')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Password must be at least 8 characters and include uppercase, lowercase, number, and special character'),
];
