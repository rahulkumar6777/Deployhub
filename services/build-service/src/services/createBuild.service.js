import { Build } from '../models/build.model.js';
import { AppError } from '../../../../shared/errors/AppError.js';


export const createBuildService = async (data) => {

    const { projectId, userId, projectName } = data;

    const build = await Build.create({
        userId,
        project: projectId,
        projectName,
        status: 'pending'
    });
    

    return { buildId: build._id }
}