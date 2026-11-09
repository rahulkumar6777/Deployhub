import { validationResult } from 'express-validator';
import { initPaidProjectPayment, verifyPaidProjectPayment } from '../../services/users/createProject.service.js';
import { returnError } from '../../../../../shared/errors/sendError.js'
import { publishGlobal } from '../../config/message-broker/rabbitmq.js';
import { createBuild } from '../../../utils/createBuild.js';
import { buildAndDeployStatusForQueues } from '../../../../../shared/constants/buildanddeploystatusforqueues.js';
import { publishProjectStatus } from '../../../../../shared/utils/publishProjectStatus.js';
import { getRedis } from '../../core/redis/client.js';
import { Project } from '../../models/project.model.js';
import { PendingOrder } from '../../models/PendingOrder.js';
import { activateBuild } from '../../../utils/activateBuild.js';
import { AppError } from '../../../../../shared/errors/AppError.js';



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
        const build = await createBuild({
            userId: req.user._id,
            projectName: req.body.projectName || req.body.name,
            expire: true,
            expiresInSeconds: 7200,
        });

        if (!build.success) {
            await PendingOrder.updateOne(
                { userId: req.user._id, orderId: order.id, status: 'pending' },
                { $set: { status: 'failed' } },
            );
            throw new AppError(build.message, 503);
        }

        await PendingOrder.findOneAndUpdate(
            { userId: req.user._id, orderId: order.id, status: 'pending' },
            { $set: { buildId: build.buildId } },
        );

        return res.status(201).json({
            success: true,
            message: 'Payment order created',
            id: order.id,
            orderId: order.id,
            amount,
            currency: order.currency || 'INR',
            plan,
            months,
            buildId: build.buildId,
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

        const { project, order, pendingOrder, buildId: pendingBuildId, alreadyProcessed } = await verifyPaidProjectPayment(req.user._id, req.body);

        if (alreadyProcessed) {
            return res.status(200).json({
                success: true,
                message: 'Payment was already verified',
                projectId: project._id,
                project,
                orderId: order.orderId,
                status: project.status,
            });
        }

        let buildId = pendingBuildId;
        if (buildId) {
            const activated = await activateBuild({ buildId, userId: req.user._id, projectId: project._id });
            if (!activated.success) {
                throw new AppError(activated.message, 503);
            }
        } else {
            

            const build = await createBuild({
                projectId: project._id,
                userId: req.user._id,
                projectName: project.name,
                expire: false,
            });
            
            if (!build.success) throw new AppError(build.message, 503);
            buildId = build.buildId;
            pendingOrder.buildId = buildId;
            await pendingOrder.save();
        }

        const data = {
            projectId: project._id,
            userId: project.userId,
            projectName: project.name
        }

        const redisclient = getRedis();
        await publishProjectStatus(redisclient, { projectId: project._id, status: 'queued' });

        let updatedProject = project;
        if (String(project.buildId || '') !== String(buildId)) {
            updatedProject = await Project.findByIdAndUpdate(
                project._id,
                { $set: { buildId }, $inc: { totalBuilds: 1 } },
                { new: true },
            );
        }

        await publishGlobal({
            event: "BUILD",
            status: buildAndDeployStatusForQueues.build["build-requested"],
            buildId,
            projectType: updatedProject.type,
            ...data,
            firstTime: true
        });

        pendingOrder.status = 'completed';
        await pendingOrder.save();


        return res.status(201).json({
            success: true,
            message: 'Payment verified. Paid project created and queued',
            projectId: project._id,
            project: updatedProject,
            orderId: order.orderId,
            status: updatedProject.status,
        });
    } catch (error) {
        console.error('paymentVerifyController error:', error);
        return returnError(res, error);
    }
};
