import mongoose from "mongoose";

const buildSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    projectName: {
        type: String
    },

    commitSha: String,

    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },

    startedAt: Date,
    finishedAt: Date,
    dockerImage: String,
    logUrl: String

}, { timestamps: true });

buildSchema.index({ project: 1, createdAt: -1 });

export const Build = mongoose.model("Build", buildSchema);