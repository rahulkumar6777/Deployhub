import { validationResult } from "express-validator";
import { returnError } from "../../../../shared/errors/sendError.js";
import { nodeRegisterService } from "../services/nodeRegister.service.js";


export const nodeRegisterController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()[0].msg
            })
        }

        const { node, nodeCredential, nodeResourceSnapshot } = await nodeRegisterService(req.body);

        return res.status(201).json({
            node,
            nodeCredential,
            nodeResourceSnapshot
        })


    } catch (error) {
        console.log(error)
        returnError(res, error)
    }
};