import mongoose from "mongoose";

const pendingorderschema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        index: true
    },
    projectData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    months: {
        type: Number,
        required: true,
        min: 1
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    plan: {
        type: String,
        enum: ["starter", "pro"],
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
        index: true
    },
    createdAt: {
        type: Date,
        expires: 7200,
        default: Date.now
    }
})


pendingorderschema.virtual('userid')
    .get(function () { return this.userId; })
    .set(function (value) { this.userId = value; });

pendingorderschema.virtual('oderid')
    .get(function () { return this.orderId; })
    .set(function (value) { this.orderId = value; });

export const PendingOrder = mongoose.model('PendingOrder', pendingorderschema)
