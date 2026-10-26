import { AppError } from "../../../../shared/errors/AppError.js";
import { NodeAllocation } from "../models/NodeAllocation.model.js";

export const confirmNodeAllocationService = async (allocationId, success) => {

    const allocation = await NodeAllocation.findOneAndUpdate(
        {
            _id: allocationId,
            status: "pending",
            expiresAt: { $gt: new Date() }
        },
        {
            $set: {
                status: success ? "confirmed" : "failed",
                expiresAt: new Date()
            }
        },
        { new: true }
    );

    if (!allocation) {
        const existingAllocation = await NodeAllocation.findById(allocationId);
        if (!existingAllocation) {
            throw new AppError("Allocation not found or expired", 404);
        }
        if (existingAllocation.status === "confirmed" && success) {
            return existingAllocation;
        }
        throw new AppError("Allocation is no longer pending", 409);
    }

    return allocation;

};

