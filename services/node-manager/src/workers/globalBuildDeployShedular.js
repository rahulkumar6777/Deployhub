import { buildAndDeployStatusForQueues } from "../../../../shared/constants/buildanddeploystatusforqueues.js";
import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { getChannel, publishToNode } from "../config/message-broker/rabbitmq.js";
import { confirmNodeAllocationService } from "../services/nodeAllocation.service.js";
import { suggestNodeService } from "../services/suggestNode.service.js";


export const globalBuildDeploySheduler = async () => {

  const channel = getChannel();

  await channel.consume(QUEUE_NAMES.GLOBAL, async (msg) => {
    if (!msg) return;
    try {

      const content = JSON.parse(msg.content.toString());

      const { event, buildId, projectId, userId, projectName, firstTime, status, projectType, allocationId } = content;

      if (event === "BUILD") {

        if (status === buildAndDeployStatusForQueues.build["build-requested"]) {

          const suggestedNode = await suggestNodeService({ nodeType: "build" });

          // here i no node are thne we trasnfer job to wwaining queue
          if (!suggestedNode) {

            await channel(QUEUE_NAMES.GLOBAL_RETRY, Buffer.from(JSON.stringify(content)), {
              persistent: true
            });
            channel.ack(msg);
            return;
          }

          // here now i send the suggested node to the build service via another queue
          await publishToNode("build", suggestedNode.nodeId, {
            buildId,
            projectId,
            userId,
            projectName,
            projectType,
            firstTime,
            status,
            ...suggestedNode
          });

        }

        if (status === buildAndDeployStatusForQueues.build["build-completed"]) {

          // Build allocations are temporary worker slots and are deleted on completion.
          if (allocationId) {
            await confirmNodeAllocationService(allocationId, "success");
          }

          const nodeType = projectType === "static" ? "deploy-static" : "deploy-dynamic";
          const suggestedNode = await suggestNodeService({
            ...(content.resources || {}),
            nodeType
          });

          if (!suggestedNode) {
            await channel(QUEUE_NAMES.GLOBAL_RETRY, Buffer.from(JSON.stringify(content)), {
              persistent: true
            });
            channel.ack(msg);
            return;
          }

          await publishToNode("deploy", suggestedNode.nodeId, {
            buildId,
            projectId,
            userId,
            projectName,
            firstTime,
            projectType,
            ...suggestedNode
          });
        }

        if ([buildAndDeployStatusForQueues.build["build-failed"], buildAndDeployStatusForQueues.build["build-cancelled"], buildAndDeployStatusForQueues.build["build-released"]].includes(status) && allocationId) {
          await confirmNodeAllocationService(allocationId, "failed");
        }
      }

      if (event === "DEPLOY") {

        if (status === buildAndDeployStatusForQueues.deploy["deploy-completed"]) {
          if (allocationId) {
            await confirmNodeAllocationService(allocationId, "success");
          }

        }

        if ([buildAndDeployStatusForQueues.deploy["deploy-failed"], buildAndDeployStatusForQueues.deploy["deploy-cancelled"], buildAndDeployStatusForQueues.deploy["deploy-released"]].includes(status) && allocationId) {
          await confirmNodeAllocationService(allocationId, "failed");
        }
      }

      channel.ack(msg);
    } catch (error) {
      console.error(
        "sheduled task failed:",
        error.message
      );

      await channel(QUEUE_NAMES.GLOBAL_RETRY, Buffer.from(JSON.stringify(msg.content)), {
        persistent: true
      });

      channel.ack(msg);
    }
  }
  )
};
