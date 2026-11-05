import { buildAndDeployStatusForQueues } from "../../../../shared/constants/buildanddeploystatusforqueues.js";
import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { fetchCommitSha } from "../../../../shared/utils/fetchCommitSha.js";
import { getUserGithubAccessToken } from "../../../../shared/utils/getUserGIthubAccesstoken.js";
import { publishProjectStatus } from "../../../../shared/utils/publishProjectStatus.js";
import { getChannel } from "../config/rabbitmq.js";
import { getRedis } from "../config/redis.js";
import { envs } from "../lib/env.js";
import axios from 'axios'


export const globalBuildSheduler = async () => {

    const channel = getChannel();
    const redis = getRedis();

    // here some univesal variables
    let projectData;
    let userGithubAcessToken;

    let startedAt;
    let finishedAt;

    await channel.consume(QUEUE_NAMES.BUILD_NODE(process.env.NODE_ID), async (msg) => {
        if (!msg) return;
        try {


            startedAt = new Date()


            const content = JSON.parse(msg.content.toString());
            const { event, buildId, projectId, userId, projectName, firstTime, status, projectType, allocationId } = content;


            await publishProjectStatus(redis, { projectId: projectId, status: 'building' })
            await channel.sendToQueue(QUEUE_NAMES.BUILD_STATUS_QUEUE, Buffer.from(JSON.stringify({ projectId, status: 'building' })), {
                persistent: true
            });

            if (event === "BUILD") {
                if (status === buildAndDeployStatusForQueues.build["build-requested"]) {


                    const rawData = await axios.get(`${envs.PROJECT_SERVICE_URL}/internal/project/${projectId}`, {
                        headers: {
                            "Content-Type": "application/json",
                            "x-internal-secret": envs.INTERNAL_SECRET,
                            "x-microservice-secret": envs.INTERNAL_SERVICE_TALKING_SECRET,
                        }
                    });

                    projectData = rawData.data.projectData;
                    console.log( projectData);

                    userGithubAcessToken = await getUserGithubAccessToken(axios, envs.IDENTITY_SERVICE_URL, userId, envs.INTERNAL_SERVICE_TALKING_SECRET, envs.INTERNAL_SECRET)
                    
                    // here fetch commitsha
                    const commitSha = await fetchCommitSha(projectData.repoUrl, projectData.branch, userGithubAcessToken);
                }
            }



        } catch (err) {
            console.error("Error processing message:", err);
        }
    });
}