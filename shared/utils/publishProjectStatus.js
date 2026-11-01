import { cacheKey } from "../cache/cacheKey.js";

export const publishProjectStatus = async (redis, payload) => {

    const { projectId, status } = payload;

    await redis.xadd(
        `deployhub:users:projects:status:${projectId}`,
        "MAXLEN",
        "=",
        1,
        "*",
        "projectId",
        String(projectId),
        "status",
        String(status),
        "timestamp",
        String(Date.now())
    );

    await redis.publish(cacheKey.userProjectStatusUpdate, JSON.stringify({ projectId: String(projectId), status: String(status) }))
};