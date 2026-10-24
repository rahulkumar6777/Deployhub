import mongoose from "mongoose";

const nodeSchema = new mongoose.Schema({
    nodeId: {
        type: String,
        required: true,
    },
    region: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Region",
        required: true
    },
    status: {
        type: String,
        enum: ["active", "inactive", "maintenance"],
        default: "active"
    },
    lastHeartbeat: {
        type: Date,
        default: Date.now
    },
    httpPortRangeStart: {
        type: String,
        requied: true
    },
    httpPortRangeEnd: {
        type: String,
        requied: true
    },
    nodeIp: {
        type: String,
    },
    nodeUrl: {
        type: String
    }
});

nodeSchema.index({ nodeId: 1 }, { unique: true });

export const Node = mongoose.model("Node", nodeSchema);
