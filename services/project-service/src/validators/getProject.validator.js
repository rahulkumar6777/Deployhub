import { param } from "express-validator";

export const getProjectValidator = [
    param("projectId")
        .notEmpty()
        .withMessage("ProjectId is requied")
        .isMongoId()
        .withMessage("invalid ProjectId")
]