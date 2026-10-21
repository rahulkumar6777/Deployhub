import { body } from 'express-validator';
import { plans } from '../../../../shared/constants/plan.js';


const PLAN_NAMES = Object.keys(plans);


export const PROJECT_TYPES = [
    ...new Set(
        Object.values(plans).flatMap((plan) => plan.deployment_Type)
    )
];


const PROJECT_VERSIONS = {
    static: ['22', '24'],
    node: ['22', '24'],
    java: ['17', '21'],
    python: ['3.10', '3.11', '3.12'],
    go: ['1.21', '1.22', '1.23']
};


const getProjectName = (body) => body.projectName || body.name;

const getProjectVersion = (body) => body.version;

const getProjectType = (body) => body.projectType || body.type;

const getRepoUrl = (body) => body.repoUrl || body.codeLink;

const getBranch = (body) => body.branch || body.branchname;

const getRootDirectory = (body) => {
    if (body.rootDirectory) {
        return body.rootDirectory;
    }

    if (body.isFolder) {
        return body.folderName;
    }

    return '.';
};


const getProjectVersions = (projectType) => {
    return PROJECT_VERSIONS[projectType];
};


const isValidUrl = (value) => {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
};


const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};


const validateProjectPayload = (_, { req }) => {
    const projectName = getProjectName(req.body);

    if (
        !projectName ||
        typeof projectName !== 'string'
    ) {
        throw new Error('Project name is required');
    }

    if (projectName.length > 100) {
        throw new Error(
            'Project name must be at most 100 characters long'
        );
    }

    if (!/^[a-zA-Z0-9-_ ]+$/.test(projectName)) {
        throw new Error(
            'Project name can only contain letters, numbers, spaces, hyphens, and underscores'
        );
    }

    if (projectName.toLowerCase() === 'default') {
        throw new Error(
            "Project name cannot be 'default'"
        );
    }


    const projectType = getProjectType(req.body);

    if (!PROJECT_TYPES.includes(projectType)) {
        throw new Error(
            `Project type must be one of: ${PROJECT_TYPES.join(', ')}`
        );
    }


    if (
        projectType === 'static' &&
        req.body.startCommand
    ) {
        throw new Error(
            'Static projects cannot have a start command'
        );
    }

    if (
        projectType !== 'static' &&
        (
            req.body.buildCommand ||
            req.body.publishDir
        )
    ) {
        throw new Error(
            `${projectType} projects cannot have static build output settings`
        );
    }


    const projectVersion = getProjectVersion(req.body);
    const validVersions = getProjectVersions(projectType);

    if (
        !validVersions ||
        !validVersions.includes(String(projectVersion))
    ) {
        throw new Error(
            `Invalid version for ${projectType}. Valid versions: ${validVersions?.join(', ')}`
        );
    }


    const repoUrl = getRepoUrl(req.body);

    if (
        !repoUrl ||
        typeof repoUrl !== 'string'
    ) {
        throw new Error('Repo URL is required');
    }

    if (!isValidUrl(repoUrl)) {
        throw new Error(
            'Repo URL must be a valid URL'
        );
    }


    const branch = getBranch(req.body);

    if (
        !branch ||
        typeof branch !== 'string'
    ) {
        throw new Error('Branch is required');
    }


    const rootDirectory = getRootDirectory(req.body);

    if (
        !rootDirectory ||
        typeof rootDirectory !== 'string'
    ) {
        throw new Error(
            'Root directory is required'
        );
    }


    if (projectType === 'static') {
        if (
            !req.body.buildCommand ||
            typeof req.body.buildCommand !== 'string'
        ) {
            throw new Error(
                'Build command is required for static project'
            );
        }

        if (
            /(dev|serve|start|preview)/i.test(
                req.body.buildCommand
            )
        ) {
            throw new Error(
                "Invalid build command. Use a terminating build script like 'npm run build' or 'npm run generate'."
            );
        }

        if (
            !req.body.publishDir ||
            typeof req.body.publishDir !== 'string'
        ) {
            throw new Error(
                'Publish directory is required for static project'
            );
        }
    }


    else {
        if (
            !req.body.startCommand ||
            typeof req.body.startCommand !== 'string'
        ) {
            throw new Error(
                `Start command is required for ${projectType} project`
            );
        }

        const port = Number(req.body.port);

        if (
            !Number.isInteger(port) ||
            port < 1 ||
            port > 65535
        ) {
            throw new Error(
                'Port must be a valid integer between 1 and 65535'
            );
        }
    }


    const subdomain =
        typeof req.body.subdomain === 'string'
            ? req.body.subdomain.trim()
            : req.body.subdomain;

    if (!subdomain) {
        throw new Error(
            'Subdomain is required'
        );
    }

    if (
        typeof subdomain !== 'string' ||
        !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(subdomain)
    ) {
        throw new Error(
            'Subdomain can only contain lowercase letters, numbers, and hyphens'
        );
    }


    if (
        req.body.env !== undefined &&
        req.body.env !== null &&
        (
            typeof req.body.env !== 'object' ||
            Array.isArray(req.body.env)
        )
    ) {
        throw new Error(
            'Env must be an object'
        );
    }


    if (
        req.body.notifications !== undefined &&
        req.body.notifications !== null &&
        (
            typeof req.body.notifications !== 'object' ||
            Array.isArray(req.body.notifications)
        )
    ) {
        throw new Error(
            'Notifications must be an object'
        );
    }


    const notifications = req.body.notifications || {};
    if (notifications.email?.enabled) {
        if (
            !notifications.email.emailAddress
        ) {
            throw new Error(
                'Email address required'
            );
        }
        if (
            !isValidEmail(
                notifications.email.emailAddress
            )
        ) {
            throw new Error(
                'Email address must be valid'
            );
        }
    }


    if (notifications.discord?.enabled) {
        if (
            !notifications.discord.webhookUrl
        ) {
            throw new Error(
                'Discord webhook URL required'
            );
        }

        if (
            !isValidUrl(
                notifications.discord.webhookUrl
            )
        ) {
            throw new Error(
                'Discord webhook URL must be valid'
            );
        }
    }


    // Telegram

    if (notifications.telegram?.enabled) {
        if (
            !notifications.telegram.botToken ||
            !notifications.telegram.chatId
        ) {
            throw new Error(
                'Telegram bot token and chat ID required'
            );
        }

        if (
            typeof notifications.telegram.botToken !== 'string' ||
            typeof notifications.telegram.chatId !== 'string'
        ) {
            throw new Error(
                'Telegram bot token and chat ID must be strings'
            );
        }
    }


    return true;
};


export const createProjectValidator = [
    body('plan')
        .optional()
        .isIn(PLAN_NAMES)
        .withMessage(
            `Plan must be one of: ${PLAN_NAMES.join(', ')}`
        ),

    body('version')
        .notEmpty()
        .withMessage(
            'Version is required'
        ),

    body().custom(validateProjectPayload)
];


export const paymentInitValidator = [
    ...createProjectValidator,

    body('plan')
        .notEmpty()
        .withMessage(
            'Plan is required'
        ),

    body('months')
        .optional()
        .isInt({
            min: 1,
            max: 24
        })
        .withMessage(
            'Months must be between 1 and 24'
        )
];


export const paymentVerifyValidator = [
    body('razorpay_order_id')
        .notEmpty()
        .withMessage(
            'Razorpay order id is required'
        )
        .isString()
        .withMessage(
            'Razorpay order id must be a string'
        ),

    body('razorpay_payment_id')
        .notEmpty()
        .withMessage(
            'Razorpay payment id is required'
        )
        .isString()
        .withMessage(
            'Razorpay payment id must be a string'
        ),

    body('razorpay_signature')
        .notEmpty()
        .withMessage(
            'Razorpay signature is required'
        )
        .isString()
        .withMessage(
            'Razorpay signature must be a string'
        )
];