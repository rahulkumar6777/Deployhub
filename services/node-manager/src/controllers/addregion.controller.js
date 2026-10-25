import { returnError } from "../../../../shared/errors/sendError.js";
import { addRegionService } from "../services/addregion.service.js";
import { validationResult } from "express-validator";

export const addRegionController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()[0].msg
            })
        }

        const regionData = req.body;
        const region = await addRegionService(regionData);

        return res.status(201).json({
            success: true,
            message: "Region added successfully",
            data: region
        });

    } catch (error) {
        returnError(res, error);
    }
}