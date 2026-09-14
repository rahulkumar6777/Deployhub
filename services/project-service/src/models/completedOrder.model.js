import mongoose from "mongoose";

const completedorderschema = new mongoose.Schema({
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
    razorpayPaymentId: {
        type: String,
        index: true
    },
    razorpaySignature: {
        type: String
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
        enum: ["completed", "refunded", "failed", "expired"],
        default: "completed"
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true
    }
}, { timestamps: true })


completedorderschema.virtual('userid')
    .get(function () { return this.userId; })
    .set(function (value) { this.userId = value; });

completedorderschema.virtual('orderid')
    .get(function () { return this.orderId; })
    .set(function (value) { this.orderId = value; });

completedorderschema.virtual('projectid')
    .get(function () { return this.projectId; })
    .set(function (value) { this.projectId = value; });

export const CompletedOrder = mongoose.model('CompletedOrder', completedorderschema)
