import { validationResult } from 'express-validator';
import { AppError } from '../../../../shared/errors/AppError.js';
import { createFreeProject } from '../services/createProject.service.js';
import { returnError } from '../../../../shared/errors/sendError.js'
import { createBuildInternalApiCall } from '../../../../shared/internal-api/createBuild.js';
import axios from 'axios';
import { env } from '../lib/env.js';
import { publishGlobal } from '../config/message-broker/rabbitmq.js';
import { Project } from '../models/project.model.js';
import { publishProjectStatus } from '../../../../shared/utils/publishProjectStatus.js'
import { getRedis } from '../core/redis/client.js';


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

        const data = {
            projectId: project._id,
            userId: project.userId,
            projectName: project.name
        }
        // here i call buildapi
        const buildId = await createBuildInternalApiCall(axios, env.BUILD_SERVICE_URL, env.INTERNAL_SECRET, env.INTERNAL_SERVICE_TALKING_SECRET, data);

        if (!buildId) {

            await Project.findByIdAndDelete(project._id);

            return res.status(500).json({
                success: false,
                message: "Build creation failed"
            })
        }

        await publishGlobal({
            event: "BUILD_REQUESTED",
            buildId,
            ...data
        });

        const redisclient = getRedis();
        await publishProjectStatus(redisclient, { projectId: project._id, status: 'queued' });

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
