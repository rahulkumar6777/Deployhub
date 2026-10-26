import { Region } from "../models/region.model.js";
import { Node } from "../models/nodes.model.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { NodeResourceSnapshot } from "../models/NodeResourceSnapshot.model.js";

export const getNodebyRegionCode = async (regioncode) => {

    const validRegion = await Region.findOne({ code: regioncode });
    if (!validRegion) {
        throw new AppError("invalid regioncode ", 404);
    };

    const nodes = await Node.find({ region: validRegion._id }).select(" id nodeId region status").lean()

    if (!nodes || nodes.length === 0) {
        throw new AppError("No nodes found for this region", 404);
    }

    return nodes;
}


export const getNodeByIdServices = async (nodeId) => {

    const node = await Node.findById(nodeId).populate("region").lean()
    console.log(node)
    if(!node){
        throw new AppError("invalid nodeid" , 404);
    }

    const nodeResources = await NodeResourceSnapshot.findOne({ nodeId: node.nodeId}).lean()

    return {
         ...node, ...nodeResources
    }
}