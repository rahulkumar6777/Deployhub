import { validationResult } from "express-validator";
import { returnError } from "../../../../shared/errors/sendError.js";
import { getNodeByIdServices, getNodebyRegionCode } from "../services/getNode.service.js";


export const getNodebyRegionCodeController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()[0].msg
            })
        }

        const regioncode = req.params.regioncode;
        const nodes = await getNodebyRegionCode(regioncode);

        return res.status(200).json({
            success: true,
            message: "Nodes fetched successfully",
            data: nodes
        });

    } catch (error) {
        console.log(error)
        returnError(res, error);
    }
}


export const getNodeByIdController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()[0].msg
            })
        }

        const nodeData = await getNodeByIdServices(req.params.id);

        return res.status(200).json({
            nodeData
        });

    } catch (error) {
        console.log(error)
        returnError(res, error)
    }
}