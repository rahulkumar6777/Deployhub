import { Build } from '../models/build.model.js';


export const createBuildService = async (data) => {

    const { projectId, userId, projectName, expire = false, expiresInSeconds = 7200 } = data;

    const expiresAt = expire
        ? new Date(Date.now() + Number(expiresInSeconds) * 1000)
        : undefined;

    const build = await Build.create({
        userId,
        ...(projectId && { project: projectId }),
        projectName,
        status: 'pending',
        ...(expiresAt && { expiresAt }),
    });

    return { buildId: build._id }
}
