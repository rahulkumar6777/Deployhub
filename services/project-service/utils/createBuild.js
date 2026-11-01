import axios from "axios";
import { createBuildInternalApiCall } from "../../../shared/internal-api/createBuild.js";
import { env } from "../src/lib/env.js";

export const createBuild = async (data, Project) => {
    const buildId = await createBuildInternalApiCall(axios, env.BUILD_SERVICE_URL, env.INTERNAL_SECRET, env.INTERNAL_SERVICE_TALKING_SECRET, data);

    if (!buildId) {

        await Project.findByIdAndDelete(project._id);

        return {
            success: "failed",
            messsage: "build createtion failed"
        }
    }

    return {
        success: true,
        messsage: "build creation successfully",
        buildId
    }
}