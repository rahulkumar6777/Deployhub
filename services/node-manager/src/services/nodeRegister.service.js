import { Node } from "../models/nodes.model.js";
import { NodeResourceSnapshot } from "../models/NodeResourceSnapshot.model.js";
import { NodeCredential } from "../models/NodeCredential.model.js";
import { Region } from "../models/region.model.js";
import { cacheKey } from "../../../../shared/cache/cacheKey.js";
import { getRedis } from "../config/redis/redis.js";
import crypto from "node:crypto";
import { AppError } from "../../../../shared/errors/AppError.js";

export const nodeRegisterService = async (nodeData) => {

    const { nodeId, regionId, httpPortRangeStart, httpPortRangeEnd, nodeIp, nodeUrl, cpuTotalPercent, memoryTotalBytes, diskTotalBytes } = nodeData;

    const region = await Region.findById(regionId);
    if (!region) {
        throw new AppError("Region not found", 404);
    }

    const checkNode = await Node.findOne({nodeId: nodeId});
    if(checkNode){
        throw new AppError("nodeid already exist, please enter another", 409)
    }

    // here i generate a random password for the node and store it in the NodeCredential collection
    const nodePassword = crypto.randomBytes(32).toString("hex");

    const nodeCredential = new NodeCredential({
        nodeId,
        credentialHash: nodePassword
    });

    const node = new Node({
        nodeId,
        region: region._id,
        httpPortRangeStart,
        httpPortRangeEnd,
        nodeIp,
        nodeUrl
    });

    const nodeResourceSnapshot = new NodeResourceSnapshot({
        node: node._id,
        nodeId,
        cpuTotalPercent,
        memoryTotalBytes,
        diskTotalBytes,
        cpuUsagePercent: "0",
        memoryUsedBytes: "0",
        diskUsedBytes: "0"
    });


    nodeCredential.node = node._id;
    nodeResourceSnapshot.node = node._id;

    await nodeCredential.save();
    await node.save();
    await nodeResourceSnapshot.save();

    return {
        node,
        nodeCredential,
        nodeResourceSnapshot
    };

}