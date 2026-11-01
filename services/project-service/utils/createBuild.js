import axios from "axios";
import { createBuildInternalApiCall } from "../../../shared/internal-api/createBuild.js";
import { env } from "../src/lib/env.js";

export const createBuild = async (data, Project) => {
    const buildData = await createBuildInternalApiCall(axios, env.BUILD_SERVICE_URL, env.INTERNAL_SECRET, env.INTERNAL_SERVICE_TALKING_SECRET, data);

    if (!buildData) {

        await Project.findByIdAndDelete(data.projectId);

        return {
            success: "failed",
            message: "build createtion failed due to build service is temperarily down, please try again later"
        }
    }

    return {
        success: true,
        message: "build creation successfully",
        buildId: buildData.data.buildId
    }
}