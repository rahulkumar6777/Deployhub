import mongoose from "mongoose";

const nodeAllocationSchema = new mongoose.Schema({
    nodeId: {
        type: String,
        required: true
    },
    cpuPercent: {
        type: Number,
        required: true
    },
    memoryBytes: {
        type: Number,
        required: true
    },
    storageBytes: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "failed"],
        default: "pending"
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 60 * 1000)
    }
}, { timestamps: true });

nodeAllocationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
nodeAllocationSchema.index({ nodeId: 1, status: 1, expiresAt: 1 });

export const NodeAllocation = mongoose.model("NodeAllocation", nodeAllocationSchema);
