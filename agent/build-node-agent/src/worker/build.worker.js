import { buildAndDeployStatusForQueues } from "../../../../shared/constants/buildanddeploystatusforqueues.js";
import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { getChannel } from "../config/rabbitmq.js";
import { envs } from "../lib/env.js";
import axios from 'axios'


export const globalBuildSheduler = async () => {

    const channel = getChannel();

    await channel.consume(QUEUE_NAMES.BUILD_NODE(process.env.NODE_ID), async (msg) => {
        if (!msg) return;
        try {

            const content = JSON.parse(msg.content.toString());
            const { event, buildId, projectId, userId, projectName, firstTime, status, projectType, allocationId } = content;


            if (event === "BUILD") {
                console.log("BUILD NODE EVENT RECEIVED", content)
                if (status === buildAndDeployStatusForQueues.build["build-requested"]) {

                    const projectData = await axios.get(`${envs.PROJECT_SERVICE_URL}/internal/project/${projectId}`, {
                        headers: {
                            "Content-Type": "application/json",
                            "x-internal-secret": envs.INTERNAL_SECRET,
                            "x-microservice-secret": envs.INTERNAL_SERVICE_TALKING_SECRET,
                        }
                    });

                    console.log("projectData", projectData.data)
                }
            }



        } catch (err) {
            console.error("Error processing message:", err);
        }
    });
}