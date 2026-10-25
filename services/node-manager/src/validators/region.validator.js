import { body, param } from "express-validator";

export const addRegionValidator = [
    body('name')
        .notEmpty()
        .withMessage('Region name is required')
        .isString()
        .withMessage('Region name must be a string'),


    body('code')
        .notEmpty()
        .withMessage('Region code is required')
        .isString()
        .withMessage('Region code must be a string')
];



export const getRegionByIdValidator = [
    param('id')
        .notEmpty()
        .withMessage('Region ID is required')
        .isMongoId()
        .withMessage('Region ID must be a valid MongoDB ObjectId')
];