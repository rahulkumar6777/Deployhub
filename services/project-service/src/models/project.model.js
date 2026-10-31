import mongoose from "mongoose";


export const Project_Status = Object.freeze([
    "draft",
    "queued",
    "building",
    "deploying",
    "running",
    "failed",
    "stopped",
    "crash",
    "deleted"
])

export const Projec_Types = Object.freeze([
    "static",
    "node",
    "go",
    "python",
    "java"
])


export const Project_Payment_Status = Object.freeze([
    "not_required",
    "pending",
    "paid",
    "failed",
    "expired"
])


const projectschema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: Projec_Types,
    },
    status: {
        type: String,
        default: 'draft',
        enum: Project_Status,
    },
    version: {
        type: Number
    },
    repoUrl: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        default: 'main'
    },
    rootDirectory: {
        type: String,
        default: "."
    },
    buildCommand: {
        type: String
    },
    publishDir: {
        type: String,
        sparse: true
    },
    startCommand: {
        type: String
    },
    port: {
        type: Number,
        default: 3000
    },
    containerId: {
        type: String,
        sparse: true
    },
    dockerContainerName: {
        type: String,
        unique: true,
        sparse: true
    },
    dockerImage: {
        type: String
    },
    subdomain: {
        type: String,
        lowercase: true,
        trim: true,
        unique: true,
        validate: {
            validator: function (value) {
                return value == null ||
                    /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
            },
            message: 'Subdomain must use lowercase letters, numbers, and hyphens'
        }
    },
    customDomains: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    env: [{
        key: String,
        encryptedValue: String
    }],
    monitor: {
        enabled: {
            type: Boolean,
            default: false
        },
        intervalSeconds: {
            type: Number,
            default: 60
        },
        healthPath: {
            type: String,
            default: "/health"
        },
        failedTries: {
            type: Number,
            default: 2
        }
    },
    notifications: {
        discord: {
            enabled: Boolean,
            webhookUrl: String
        },
        telegram: {
            enabled: Boolean,
            botToken: String,
            chatId: String
        },
        email: {
            enabled: Boolean,
            emailAddress: String
        }
    },
    totalBuilds: {
        type: Number,
        default: 0
    },
    buildId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    plan: {
        type: String,
        enum: ["free", "starter", "pro"],
        default: "free"
    },
    paymentStatus: {
        type: String,
        enum: Project_Payment_Status,
        default: 'not_required',
        index: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CompletedOrder"
    }
}, { timestamps: true });

projectschema.index(
    { userId: 1, dockerContainerName: 1 },
    {
        unique: true,
        partialFilterExpression: {
            dockerContainerName: { $type: 'string' }
        }
    }
);

projectschema.index({ userId: 1, paymentStatus: 1, createdAt: -1 });


export const Project = mongoose.model("Project", projectschema);
