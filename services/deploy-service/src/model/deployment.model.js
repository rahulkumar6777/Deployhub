import mongoose from 'mongoose';
const { Schema } = mongoose;

// ye hai static web ke liye
const artifactSchema = new Schema({
    provider: String,
    fileId: String,
    objectKey: String,
    checksum: String,
    sizeBytes: Number,
}, { _id: false });


// ye hai git ka track kaun sa deploy hua hai
const sourceSchema = new Schema({
    branch: String,
    commitSha: String,
    artifact: artifactSchema,
    image: {
        type: String
    },
}, { _id: false });


// yeha pe kaun sa node type ke deploy and full node ka details
const targetSchema = new Schema({
    nodeId: String,
    nodeType: {
        type: String,
        enum: ['deploy-static', 'deploy-dynamic'],
    },
    allocationId: Schema.Types.ObjectId,
}, { _id: false });

// ye runstime details hai
const runtimeSchema = new Schema({
    containerId: String,
    containerName: String,
    containerPort: Number,
    hostPort: Number,
}, { _id: false });



const failureSchema = new Schema({
    stage: String,
    code: String,
    message: String,
    traceId: String,
}, { _id: false });



const initiatedBySchema = new Schema({
    type: {
        type: String,
        enum: ['user', 'system', 'webhook'],
        default: 'system',
    },
    userId: Schema.Types.ObjectId,
}, { _id: false });



const deploymentSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    buildId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    deploymentType: {
        type: String,
        enum: ['static', 'dynamic'],
        required: true,
    },
    status: {
        type: String,
        enum: ['queued', 'deploying', 'live', 'failed', 'stopped', 'superseded'],
        default: 'queued',
        index: true,
    },
    isCurrent: {
        type: Boolean,
        default: false,
    },
    trigger: {
        type: String,
        enum: ['initial-build', 'manual', 'git-push', 'rollback', 'system'],
        default: 'initial-build',
    },
    initiatedBy: initiatedBySchema,
    source: sourceSchema,
    target: targetSchema,
    runtime: runtimeSchema,
    projectConfigVersion: String,
    logUrl: String,
    failure: failureSchema,
    previousDeploymentId: Schema.Types.ObjectId,
    idempotencyKey: String,
    attempt: {
        type: Number,
        min: 1,
        default: 1,
    },
    queuedAt: {
        type: Date,
        default: Date.now,
    },
    startedAt: Date,
    deployedAt: Date,
    failedAt: Date,
    stoppedAt: Date,
}, { timestamps: true });

deploymentSchema.index({ projectId: 1, createdAt: -1 });
deploymentSchema.index({ 'target.nodeId': 1, status: 1 });
deploymentSchema.index(
    { idempotencyKey: 1 },
    { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
);
deploymentSchema.index(
    { projectId: 1 },
    { unique: true, partialFilterExpression: { isCurrent: true } },
);

export const Deployment = mongoose.model('Deployment', deploymentSchema);
