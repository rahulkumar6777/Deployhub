import { validationResult } from 'express-validator';
import { initPaidProjectPayment, verifyPaidProjectPayment } from '../services/createProject.service.js';
import { returnError } from '../../../../shared/errors/sendError.js'



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
