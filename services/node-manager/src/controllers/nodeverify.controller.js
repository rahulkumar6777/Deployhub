import { returnError } from "../../../../shared/errors/sendError.js";
import { nodeVerifyService } from "../services/nodeverify.service.js";

export const nodeVerifyController = async (req, res) => {
    try {
        const result = await nodeVerifyService(req.params.id, req.body.secret, req.body.resources);
        return res.status(200).json(result);
    } catch (error) {
        console.log(error)
        returnError(res, error);
    }
};
