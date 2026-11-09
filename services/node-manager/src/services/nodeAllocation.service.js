import { AppError } from "../../../../shared/errors/AppError.js";
import { NodeAllocation } from "../models/NodeAllocation.model.js";

const isSuccessful = (result) =>
    result === true || ["success", "completed"].includes(String(result).toLowerCase());

export const confirmNodeAllocationService = async (allocationId, result) => {
    const success = isSuccessful(result);
    const allocation = await NodeAllocation.findById(allocationId);

    if (!allocation) {
        if (!success) {
            return { allocationId, released: true };
        }

        throw new AppError("Allocation not found or expired", 404);
    }

    // Build allocations only reserve a worker slot while the build is running.
    if (allocation.nodeType === "build" || !success) {
        await NodeAllocation.deleteOne({ _id: allocation._id });
        return {
            allocationId: allocation._id,
            released: true,
        };
    }

    if (allocation.status === "completed") {
        return allocation;
    }

    const now = new Date();
    if (allocation.expiresAt && allocation.expiresAt <= now) {
        await NodeAllocation.deleteOne({ _id: allocation._id });
        throw new AppError("Allocation expired before confirmation", 409);
    }

    const confirmedAllocation = await NodeAllocation.findOneAndUpdate(
        {
            _id: allocation._id,
            status: "pending",
            expiresAt: { $gt: now },
        },
        {
            $set: { status: "completed" },
            $unset: { expiresAt: 1 },
        },
        { new: true }
    );

    if (!confirmedAllocation) {
        const latestAllocation = await NodeAllocation.findById(allocation._id);
        if (latestAllocation?.status === "completed") {
            return latestAllocation;
        }

        throw new AppError("Allocation is no longer pending", 409);
    }

    return confirmedAllocation;
};
