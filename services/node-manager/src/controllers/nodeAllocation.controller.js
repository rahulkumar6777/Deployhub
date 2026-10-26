import { validationResult } from "express-validator";
import { returnError } from "../../../../shared/errors/sendError.js";
import { confirmNodeAllocationService } from "../services/nodeAllocation.service.js";

export const confirmNodeAllocationController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()[0].msg
            });
        }

        const allocation = await confirmNodeAllocationService(req.params.allocationId, req.body.success);

        return res.status(200).json({
            success: true,
            data: allocation
        });

    } catch (error) {
        console.log(error)
        returnError(res, error);
    }
};
