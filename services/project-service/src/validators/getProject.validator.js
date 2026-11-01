import { body } from "express-validator";

export const getProjectValidator = [
    body("projectId")
        .notEmpty()
        .withMessage("ProjectId is requied")
        .isMongoId()
        .withMessage("invalid ProjectId")
]