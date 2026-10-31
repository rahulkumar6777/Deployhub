import axios from 'axios';
import crypto, { randomUUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../../../shared/errors/AppError.js';
import { plans } from '../../../../shared/constants/plan.js';
import { env } from '../lib/env.js';
import { getRedis } from '../core/redis/client.js';
import { Project } from '../models/project.model.js';
import { PendingOrder } from '../models/PendingOrder.js';
import { CompletedOrder } from '../models/completedOrder.model.js';


const PAID_PLANS = Object.keys(plans).filter(
    (plan) => plan !== 'free'
);

const dockerContainerName = (projectId) => {
    return `cnt${projectId
        .toString()
        .substring(15, 24)}${uuidv4()
            .substring(0, 9)
            .slice(0, 8)}`;
};


const getProjectType = (body) => {
    return body.projectType || body.type;
};


const normalizeSubdomain = (subdomain) => {
    if (typeof subdomain !== 'string') {
        return '';
    }

    return `${subdomain.trim()}-${randomUUID().slice(0, 8)}`;
};


const normalizeProjectBody = (body) => {
    const projectType = getProjectType(body);

    return {
        projectName:
            body.projectName || body.name,

        projectType,

        repoUrl:
            body.repoUrl || body.codeLink,

        branch:
            body.branch ||
            body.branchname ||
            'main',

        rootDirectory:
            body.rootDirectory ||
            (
                body.isFolder
                    ? body.folderName
                    : '.'
            ) ||
            '.',

        buildCommand:
            body.buildCommand,

        publishDir:
            body.publishDir,

        startCommand:
            body.startCommand,

        port:
            Number(body.port || 3000),

        subdomain:
            normalizeSubdomain(body.subdomain),

        env:
            body.env,

        notifications:
            body.notifications || {},

        monitor:
            body.monitor || {},

        version:
            body.version
    };
};


const assertPlanAllowsProject = (
    planName,
    projectType
) => {
    const plan = plans[planName];

    if (!plan) {
        throw new AppError(
            `Invalid plan: ${planName}`,
            400
        );
    }

    if (
        !plan.deployment_Type.includes(
            projectType
        )
    ) {
        throw new AppError(
            `${planName} plan does not support ${projectType} projects. Allowed types: ${plan.deployment_Type.join(', ')}`,
            403
        );
    }
};


const normalizeEnv = (env) => {
    if (!env) {
        return [];
    }

    return Object.entries(env).map(
        ([key, value]) => ({
            key,
            encryptedValue: String(value)
        })
    );
};


const normalizeNotifications = (
    notifications = {}
) => {
    const discordNotification =
        notifications.discord || {};

    const telegramNotification =
        notifications.telegram || {};

    const emailNotification =
        notifications.email || {};


    return {
        discord: {
            enabled: Boolean(
                discordNotification.enabled
            ),

            webhookUrl:
                discordNotification.webhookUrl ||
                null
        },

        telegram: {
            enabled: Boolean(
                telegramNotification.enabled
            ),

            botToken:
                telegramNotification.botToken ||
                null,

            chatId:
                telegramNotification.chatId ||
                null
        },

        email: {
            enabled: Boolean(
                emailNotification.enabled
            ),

            emailAddress:
                emailNotification.emailAddress ||
                null
        }
    };
};


const planEndDate = (months) => {
    const endDate = new Date();

    endDate.setMonth(
        endDate.getMonth() + months
    );

    return endDate;
};


const createRazorpayOrder = async ({
    amount,
    receipt,
    notes
}) => {
    const response = await axios.post(
        'https://api.razorpay.com/v1/orders',

        {
            amount,
            currency: 'INR',
            receipt,
            notes
        },

        {
            auth: {
                username:
                    env.RAZORPAY_KEY_ID,

                password:
                    env.RAZORPAY_KEY_SECRET
            },

            timeout: 10000
        }
    );

    return response.data;
};


const verifyRazorpaySignature = ({
    orderId,
    paymentId,
    signature
}) => {
    const expectedSignature = crypto
        .createHmac(
            'sha256',
            env.RAZORPAY_KEY_SECRET
        )
        .update(
            `${orderId}|${paymentId}`
        )
        .digest('hex');


    if (
        signature.length !==
        expectedSignature.length
    ) {
        return false;
    }


    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
    );
};


const planAmountInPaise = (
    planName,
    months
) => {
    const amount =
        Number(
            plans[planName]?.price || 0
        ) *
        months *
        100;

    return Math.round(amount);
};


export const createProjectForPlan = async (
    userId,
    body,
    {
        planName = 'free',
        paymentStatus = 'not_required',
        months = null,
        paymentId = null
    } = {}
) => {
    const normalized =
        normalizeProjectBody(body);


    assertPlanAllowsProject(
        planName,
        normalized.projectType
    );


    const redisclient = getRedis();


    const now = new Date();


    const project = await Project.create({
        userId,

        name:
            normalized.projectName,

        type:
            normalized.projectType,

        repoUrl:
            normalized.repoUrl,

        branch:
            normalized.branch,

        rootDirectory:
            normalized.rootDirectory,

        buildCommand:
            normalized.buildCommand,

        publishDir:
            normalized.publishDir,

        startCommand:
            normalized.startCommand,

        port:
            normalized.port,


        subdomain:
            normalized.subdomain,

        env:
            normalizeEnv(
                normalized.env
            ),

        plan:
            planName,

        paymentStatus,

        status:
            'queued',

        startDate:
            planName === 'free'
                ? undefined
                : now,

        endDate:
            planName === 'free'
                ? undefined
                : planEndDate(months),

        paymentId,

        monitor: {
            enabled: Boolean(
                plans[planName].uptime_monitoring &&
                normalized.monitor.enabled
            ),

            intervalSeconds:
                normalized.monitor.intervalSeconds ||
                60,

            healthPath:
                normalized.monitor.healthPath ||
                '/health',

            failedTries:
                normalized.monitor.failedTries ||
                2
        },

        notifications:
            normalizeNotifications(
                normalized.notifications
            ),

        version:
            normalized.version
    });


    project.dockerContainerName =
        dockerContainerName(
            project._id
        );


    await project.save({
        validateBeforeSave: false
    });


    await publishProjectStatus(
        redisclient,
        {
            projectId:
                project._id,

            status:
                'queued'
        }
    );


    return {
        project
    };
};



export const createFreeProject = async (
    userId,
    body
) => {
    return createProjectForPlan(
        userId,
        body,
        {
            planName:
                'free',

            paymentStatus:
                'not_required'
        }
    );
};


export const initPaidProjectPayment = async (
    userId,
    body
) => {
    const planName =
        body.plan;

    const months =
        Number(body.months || 1);


    const normalized =
        normalizeProjectBody(body);


    if (
        !PAID_PLANS.includes(
            planName
        )
    ) {
        throw new AppError(
            `Paid project plan must be one of: ${PAID_PLANS.join(', ')}`,
            400
        );
    }


    assertPlanAllowsProject(
        planName,
        normalized.projectType
    );


    const amount =
        planAmountInPaise(
            planName,
            months
        );


    if (amount <= 0) {
        throw new AppError(
            'Payment amount must be greater than zero',
            400
        );
    }


    const receipt =
        `project_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;


    const order =
        await createRazorpayOrder({
            amount,

            receipt,

            notes: {
                userId:
                    userId.toString(),

                plan:
                    planName,

                projectType:
                    normalized.projectType
            }
        });


    await PendingOrder.create({
        userId,

        orderId:
            order.id,

        projectData:
            body,

        months,

        amount,

        plan:
            planName,

        status:
            'pending'
    });


    return {
        order,
        amount,
        plan: planName,
        months
    };
};


export const verifyPaidProjectPayment = async (
    userId,
    body
) => {
    const {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature
    } = body;


    const pendingOrder =
        await PendingOrder.findOne({
            userId,
            orderId,
            status: 'pending'
        });


    if (!pendingOrder) {
        throw new AppError(
            'Pending payment order not found or already processed',
            404
        );
    }


    const validSignature =
        verifyRazorpaySignature({
            orderId,
            paymentId,
            signature
        });


    if (!validSignature) {
        pendingOrder.status =
            'failed';

        await pendingOrder.save();

        throw new AppError(
            'Payment signature verification failed',
            400
        );
    }


    const { project } =
        await createProjectForPlan(
            userId,
            pendingOrder.projectData,
            {
                planName:
                    pendingOrder.plan,

                paymentStatus:
                    'paid',

                months:
                    pendingOrder.months
            }
        );


    const completedOrder =
        await CompletedOrder.create({
            userId,

            orderId,

            razorpayPaymentId:
                paymentId,

            razorpaySignature:
                signature,

            months:
                pendingOrder.months,

            amount:
                pendingOrder.amount,

            plan:
                pendingOrder.plan,

            projectId:
                project._id,

            status:
                'completed'
        });


    project.paymentId =
        completedOrder._id;

    await project.save({
        validateBeforeSave: false
    });


    pendingOrder.status =
        'completed';

    await pendingOrder.save();


    return {
        project,
        order: completedOrder
    };
};