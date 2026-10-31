import { validationResult } from 'express-validator';
import { AppError } from '../../../../shared/errors/AppError.js';
import { createFreeProject } from '../services/createProject.service.js';
import { returnError } from '../../../../shared/errors/sendError.js'

export const createProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
            });
        }

        const user = req.user;
        const requestedPlan = req.body.plan || 'free';

        if (requestedPlan !== 'free') {
            throw new AppError('Use /payment/init for paid project plans', 402);
        }

        const { project } = await createFreeProject(user._id, req.body);

        // here i call buildapi
        

        return res.status(201).json({
            success: true,
            message: 'Free project created and queued',
            projectId: project._id,
            project,
            subdomain: project.subdomain,
            status: project.status,
        });
    } catch (error) {
        console.error('createProject error:', error);
        return returnError(res, error);
    }
};
