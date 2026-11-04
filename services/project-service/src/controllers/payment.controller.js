import { validationResult } from 'express-validator';
import { initPaidProjectPayment, verifyPaidProjectPayment } from '../services/createProject.service.js';
import { returnError } from '../../../../shared/errors/sendError.js'
import { publishGlobal } from '../config/message-broker/rabbitmq.js';
import { createBuild } from '../../utils/createBuild.js';
import { buildAndDeployStatusForQueues } from '../../../../shared/constants/buildanddeploystatusforqueues.js';
import { publishProjectStatus } from '../../../../shared/utils/publishProjectStatus.js';
import { getRedis } from '../core/redis/client.js';
import { Project } from '../models/project.model.js';



export const paymentInitController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
            });
        }

        const { order, amount, plan, months } = await initPaidProjectPayment(req.user._id, req.body);

        return res.status(201).json({
            success: true,
            message: 'Payment order created',
            id: order.id,
            orderId: order.id,
            amount,
            currency: order.currency || 'INR',
            plan,
            months,
        });
    } catch (error) {
        console.error('paymentInitController error:', error);
        return returnError(res, error);
    }
};

export const paymentVerifyController = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
            });
        }

        const { project, order } = await verifyPaidProjectPayment(req.user._id, req.body);

        const data = {
            projectId: project._id,
            userId: project.userId,
            projectName: project.name
        }
        // here i call buildapi
        const { success, buildId, message } = await createBuild(data, Project);

        if (success === false) {
            return res.status(400).json({
                success,
                message
            })
        }

        await publishGlobal({
            event: "BUILD",
            status: buildAndDeployStatusForQueues.build["build-requested"],
            buildId,
            projectType: project.type,
            ...data,
            firstTime: true
        });

        const redisclient = getRedis();
        await publishProjectStatus(redisclient, { projectId: project._id, status: 'queued' });

        await Project.findByIdAndUpdate(
            project._id,
            {
                buildId,
                $inc: { totalBuilds: 1 }
            }
        );


        return res.status(201).json({
            success: true,
            message: 'Payment verified. Paid project created and queued',
            projectId: project._id,
            project,
            orderId: order.orderId,
            status: project.status,
        });
    } catch (error) {
        console.error('paymentVerifyController error:', error);
        return returnError(res, error);
    }
};
