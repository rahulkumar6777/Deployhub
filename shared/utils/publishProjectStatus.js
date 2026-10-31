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

    await redis.publish('deployhub:users:projects:status:updates', JSON.stringify({ projectId: String(projectId), status: String(status) }))
};