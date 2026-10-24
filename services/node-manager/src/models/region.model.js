import mongoose from "mongoose";

export const regionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ["active", "inactive", "maintenance"],
        default: "active"
    }
})

regionSchema.index({ code: 1 }, { unique: true })

export const Region = mongoose.model("Region", regionSchema);