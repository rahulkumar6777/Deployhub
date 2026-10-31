import { body } from 'express-validator';

export const createBuildValidator = [
    body('projectId')
        .notEmpty()
        .withMessage('projectId is Required')
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
        .withMessage("projectName must be a string")
]