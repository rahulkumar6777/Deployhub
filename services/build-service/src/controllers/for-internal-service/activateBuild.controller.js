import { validationResult } from 'express-validator';
import { returnError } from '../../../../../shared/errors/sendError.js';
import { activateBuildService } from '../../services/for-internal-service/activateBuild.service.js';

export const activateBuildController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const data = await activateBuildService({
            buildId: req.params.buildId,
            userId: req.body.userId,
            projectId: req.body.projectId,
        });

        return res.status(200).json({ success: true, data });
    } catch (error) {
        returnError(res, error);
    }
};
