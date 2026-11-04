import { getProjectService } from "../services/getProject.service.js";
import { returnError } from '../../../../shared/errors/sendError.js'
import { validationResult } from "express-validator";

export const getProjectController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            })
        };


        const { projectData } = await getProjectService(req.params.projectId);

        return res.status(200).json({
            success: false,
            message: "projectData fetch successfully",
            projectData
        });



    } catch (error) {
        returnError(res, error)
    }
};