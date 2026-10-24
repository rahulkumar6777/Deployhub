import mongoose from "mongoose";

const nodeCredentialSchema = new mongoose.Schema({
    node: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Node",
        required: true
    },
    nodeId: {
        type: String,
        required: true
    },
    credentialHash: {
        type: String,
        required: true
    }
});

nodeCredentialSchema.index({ nodeId: 1 }, { unique: true });

export const NodeCredential = mongoose.model("NodeCredential", nodeCredentialSchema);