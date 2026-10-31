import { returnError } from "../../../../shared/errors/sendError.js";
import { createBuildService } from "../services/createBuild.service.js";
import { validationResult } from 'express-validator';

export const createBuildController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        };

        const buildId = await createBuildService(req.body);

        return res.status(200).json({
            success: true,
            data: buildId
        })
    } catch (error) {
        returnError(res, error)
    }
};