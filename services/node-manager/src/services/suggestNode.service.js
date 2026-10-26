import { Node } from "../models/nodes.model.js";
import { NodeResourceSnapshot } from "../models/NodeResourceSnapshot.model.js";
import { NodeAllocation } from "../models/NodeAllocation.model.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { getRedis } from "../config/redis/redis.js";
import crypto from "node:crypto";
import { cacheKey } from "../../../../shared/cache/cacheKey.js";

const releaseNodeLock = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
    end
    return 0
`;

export const suggestNodeService = async (resources) => {

    const { cpuPercent, memoryBytes, storageBytes } = resources;
    const redis = getRedis();

    const nodes = await Node.find({ status: "active" }).lean();
    if (!nodes || nodes.length === 0) {
        throw new AppError("No active nodes found", 404);
    }

    cacheKey
    for (const node of nodes) {
        const lockKey = cacheKey.nodelockKey(node.nodeId)
        const lockId = crypto.randomUUID();
        const lock = await redis.set(lockKey, lockId, "PX", 30000, "NX");
        if (lock !== "OK") {
            continue;
        }

        try {
            const nodeResources = await NodeResourceSnapshot.findOne({ nodeId: node.nodeId }).lean();
            if (!nodeResources) {
                continue;
            }

            const now = new Date();
            const allocations = await NodeAllocation.find({
                nodeId: node.nodeId,
                $or: [
                    { status: "pending", expiresAt: { $gt: now } }
                ]
            }).lean();

            const reservedCpuPercent = allocations.reduce((total, allocation) => total + allocation.cpuPercent, 0);
            const reservedMemoryBytes = allocations.reduce((total, allocation) => total + allocation.memoryBytes, 0);
            const reservedStorageBytes = allocations.reduce((total, allocation) => total + allocation.storageBytes, 0);

            const cpuAvailablePercent = Number(nodeResources.cpuTotalPercent) - Number(nodeResources.cpuUsagePercent) - reservedCpuPercent;
            const memoryAvailableBytes = Number(nodeResources.memoryTotalBytes) - Number(nodeResources.memoryUsedBytes) - reservedMemoryBytes;
            const storageAvailableBytes = Number(nodeResources.diskTotalBytes) - Number(nodeResources.diskUsedBytes) - reservedStorageBytes;

            if (
                cpuAvailablePercent < cpuPercent ||
                memoryAvailableBytes < memoryBytes ||
                storageAvailableBytes < storageBytes
            ) {
                continue;
            }

            const allocation = new NodeAllocation({
                nodeId: node.nodeId,
                cpuPercent,
                memoryBytes,
                storageBytes
            });
            await allocation.save();

            return {
                allocationId: allocation._id,
                expiresAt: allocation.expiresAt,
                nodeId: node.nodeId,
                nodeUrl: node.nodeUrl,
                nodeIp: node.nodeIp,
                available: {
                    cpuPercent: cpuAvailablePercent - cpuPercent,
                    memoryBytes: memoryAvailableBytes - memoryBytes,
                    storageBytes: storageAvailableBytes - storageBytes
                }
            };
        } finally {
            await redis.eval(releaseNodeLock, 1, lockKey, lockId);
        }
    }

    throw new AppError("No node has enough available resources", 404);

}
