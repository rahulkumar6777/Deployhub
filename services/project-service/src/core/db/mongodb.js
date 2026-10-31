import mongoose from "mongoose";
import { env } from "../../lib/env.js";

mongoose.set("strictQuery", true);

export const connectDb = async () => {
    try {
        await mongoose.connect(env.MONGODB_URI, {
            maxPoolSize: 20,
            minPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
        });

        console.log("MongoDB Connected");

        mongoose.connection.on("error", (err) => {
            console.error("MongoDB error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("MongoDB disconnected");
        });

    } catch (error) {
        console.error("Error connecting to DB:", error.message);
        throw error;
    }
};

export const closeDb = async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
};
