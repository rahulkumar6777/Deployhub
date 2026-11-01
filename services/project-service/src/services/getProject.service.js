import { AppError } from "../../../../shared/errors/AppError.js";
import { Project } from "../models/project.model.js"

export const getProjectService = async (projectId) => {

    const projectData = await Project.findById(projectId).select(" userId name type status version repoUrl branch rootDirectory buildCommand publishDir startCommand port containerId dockerContainerName dockerImage subdomain customDomains env monitor notifications plan").lean();
    if (!projectData) {
        throw new AppError("invalid ProjectId", 404)
    };

    return {
        
        projectData
    }

}