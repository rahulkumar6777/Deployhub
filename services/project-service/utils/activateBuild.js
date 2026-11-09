import axios from 'axios';
import { activateBuildInternalApiCall } from '../../../shared/internal-api/activateBuild.js';
import { env } from '../src/lib/env.js';

export const activateBuild = async ({ buildId, userId, projectId }) => {
    const response = await activateBuildInternalApiCall(
        axios,
        env.BUILD_SERVICE_URL,
        env.INTERNAL_SECRET,
        env.INTERNAL_SERVICE_TALKING_SECRET,
        buildId,
        { userId, projectId },
    );

    if (!response?.success) {
        return { success: false, message: response?.message || 'Build activation failed' };
    }

    return { success: true, ...response.data };
};
