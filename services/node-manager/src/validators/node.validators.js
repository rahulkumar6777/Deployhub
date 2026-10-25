import { body, param } from "express-validator";

// export const addNodeValidator = [
//     body
// ]

export const getNodebyRegionCodeValidator = [
    param('regioncode')
        .notEmpty()
        .withMessage('Region code is required')
        .isString()
        .withMessage('Region code must be a string')
];