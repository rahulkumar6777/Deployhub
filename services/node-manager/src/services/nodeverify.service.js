import crypto from "node:crypto";
import { NodeCredential } from "../models/NodeCredential.model.js";
import { NodeResourceSnapshot } from "../models/NodeResourceSnapshot.model.js";
import { Node } from "../models/nodes.model.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export const nodeVerifyService = async (nodeId, secret, resources) => {

    if (typeof secret !== "string" || !secret) {
        throw new AppError("Invalid node credentials", 401);
    }

    const [node, credential] = await Promise.all([
        Node.findOne({ nodeId }),
        NodeCredential.findOne({ nodeId }),
    ]);

    if (!node || !credential) {
        throw new AppError("Invalid node credentials", 401);
    };

    const supplied = Buffer.from(secret);
    const stored = Buffer.from(credential.credentialHash);
    if (supplied.length !== stored.length || !crypto.timingSafeEqual(supplied, stored)) {
        throw new AppError("Invalid node credentials", 401);
    }

    if (!resources?.cpu || !resources?.memory || !resources?.disk) {
        throw new AppError("Node resources are required", 400);
    }
    const cpuTotalPercent = Number(resources.cpu.cores) * 100;
    const cpuUsagePercent = Number(resources.cpu.usagePercent);
    const memoryTotalBytes = Number(resources.memory.totalBytes);
    const memoryUsedBytes = Number(resources.memory.usedBytes);
    const diskTotalBytes = Number(resources.disk.totalBytes);
    const diskUsedBytes = Number(resources.disk.usedBytes);
    const values = [cpuTotalPercent, cpuUsagePercent, memoryTotalBytes, memoryUsedBytes, diskTotalBytes, diskUsedBytes];
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
        throw new AppError("Invalid node resource values", 400);
    }

    const snapshot = await NodeResourceSnapshot.findOneAndUpdate(
        { nodeId },
        { $set: { cpuTotalPercent, cpuUsagePercent, memoryTotalBytes, memoryUsedBytes, diskTotalBytes, diskUsedBytes } },
        { new: true, runValidators: true }
    );
    if (!snapshot) throw new AppError("Node resource snapshot not found", 404);

    node.lastHeartbeat = new Date();
    node.status = "active";
    await node.save();
    return { nodeId, verified: true, resources: snapshot };
};
