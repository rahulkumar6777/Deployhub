import mongoose from "mongoose";
import { envs } from "../../lib/env.js";


export const connectToMongoDB = async () => {
    try {

        await mongoose.connect(envs.MONGODB_URI, {
            maxPoolSize: 20,
            minPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });
        console.log("MongoDB Connected");

    } catch (error) {
        throw new Error(`Error while connect to MongoDb , ${error.message}`)
    }
}

export const disconnectFromMongoDB = async () => {
    try {
        await mongoose.connection.close();
    } catch (error) {
        throw new Error(`Error while disconnect from MongoDb , ${error.message}`)
    }
}