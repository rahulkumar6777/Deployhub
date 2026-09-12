import { body } from "express-validator";
import { AppError } from "../../../../shared/errors/AppError.js";

export const profilePicValidator = [
    body('profilePic')
        .custom((value, { req }) => {
            if (!req.file) {
                throw new AppError('Profile picture is required', 400);
            }

            return true;
        })
]