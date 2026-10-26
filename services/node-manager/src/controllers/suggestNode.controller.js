import { validationResult } from "express-validator";
import { returnError } from "../../../../shared/errors/sendError.js";
import { suggestNodeService } from "../services/suggestNode.service.js";

export const suggestNodeController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()[0].msg
            });
        }

        const node = await suggestNodeService(req.body);

        return res.status(200).json({
            success: true,
            data: node
        });

    } catch (error) {
        console.log(error)
        returnError(res, error);
    }
};
