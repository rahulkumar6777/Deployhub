import { body, param } from 'express-validator';

export const activateBuildValidator = [
    param('buildId').isMongoId().withMessage('Invalid buildId'),
    body('userId').isMongoId().withMessage('Invalid userId'),
    body('projectId').isMongoId().withMessage('Invalid projectId'),
];
