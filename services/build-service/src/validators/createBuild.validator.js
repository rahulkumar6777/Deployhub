import { body } from 'express-validator';

export const createBuildValidator = [
    body('projectId')
        .optional()
        .isMongoId()
        .withMessage("Invalid projectid"),
    body('userId')
        .notEmpty()
        .withMessage('userId is Required')
        .isMongoId()
        .withMessage("Invalid userId"),
    body('projectName')
        .notEmpty()
        .withMessage('projectName is Required')
        .isString()
        .withMessage("projectName must be a string"),
    body('expire')
        .optional()
        .isBoolean()
        .withMessage('expire must be a boolean'),
    body('expiresInSeconds')
        .optional()
        .isInt({ min: 60, max: 86400 })
        .withMessage('expiresInSeconds must be between 60 and 86400'),
];
