import mongoose from "mongoose";

const NodeResourceSnapshotSchema = new mongoose.Schema({
    node: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Node",
        required: true
    },
    nodeId: {
        type: String,
        required: true
    },
    cpuTotalPercent: {
        type: String,
        requied: true,
    },
    cpuUsagePercent: {
        type: String,
        requied: true,
    },
    memoryTotalBytes: {
        type: String,
        requied: true,
    },
    memoryUsedBytes: {
        type: String,
        requied: true,
    },
    diskTotalBytes: {
        type: String,
        requied: true,
    },
    diskUsedBytes: {
        type: String,
        requied: true,
    }
});


NodeResourceSnapshotSchema.index({ nodeId: 1 }, { unique: true });


export const NodeResourceSnapshot = mongoose.model("NodeResourceSnapshot", NodeResourceSnapshotSchema);
