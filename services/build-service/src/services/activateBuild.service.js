import { Build } from '../models/build.model.js';
import { AppError } from '../../../../shared/errors/AppError.js';

export const activateBuildService = async ({ buildId, userId, projectId }) => {
    const build = await Build.findOne({ _id: buildId, userId });

    if (!build) throw new AppError('Pending build not found', 404);
    if (build.project && String(build.project) !== String(projectId)) {
        throw new AppError('Build is already attached to another project', 409);
    }

    build.project = projectId;
    build.expiresAt = undefined;
    await build.save({ runValidators: true });

    return { buildId: build._id, projectId: build.project };
};
