import { validationResult } from "express-validator";
import { returnError } from "../../../../shared/errors/sendError.js";
import { getRegionsService, getRegionByIdService } from "../services/getRegion.service.js";


export const getRegionsController = async (req, res) => {
    try {


        const regions = await getRegionsService();

        return res.status(200).json({
            success: true,
            message: "Regions fetched successfully",
            data: regions
        });

    } catch (err) {
        returnError(res, err);
    }
}

export const getRegionByIdController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()[0].msg
            })
        }


        const regionId = req.params.id;
        const region = await getRegionByIdService(regionId);

        return res.status(200).json({
            success: true,
            message: "Region fetched successfully",
            data: region
        });
    } catch (err) {
        console.error(err);
        returnError(res, err);
    }
}
