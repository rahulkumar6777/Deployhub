import { buildAndDeployStatusForQueues } from "../../../../shared/constants/buildanddeploystatusforqueues.js";
import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { getChannel, publishToNode } from "../config/message-broker/rabbitmq.js";
import { confirmNodeAllocationService } from "../services/nodeAllocation.service.js";
import { suggestNodeService } from "../services/suggestNode.service.js";


const MAX_RETRIES = 20;


const sendToRetryQueue = (channel, content) => {
  const retryCount = Number(content.retryCount || 0) + 1;
  const retryData = { ...content, retryCount };

  if (retryCount > MAX_RETRIES) {
    console.error("Retry limit reached, sending task to dead letter queue", {
      event: content.event,
      status: content.status,
      buildId: content.buildId,
      projectId: content.projectId,
    });

    channel.sendToQueue(
      QUEUE_NAMES.GLOBAL_DEAD_LETTER,
      Buffer.from(JSON.stringify(retryData)),
      { persistent: true, contentType: "application/json" },
    );
    return;
  }

  channel.sendToQueue(
    QUEUE_NAMES.GLOBAL_RETRY,
    Buffer.from(JSON.stringify(retryData)),
    { persistent: true, contentType: "application/json" },
  );
};


const releaseAllocation = async (allocationId, result) => {
  if (!allocationId) return;

  try {
    await confirmNodeAllocationService(allocationId, result);
  } catch (error) {
    // allocation expire ho chuka ho to task ko dobara retry karne ki zaroorat nahi
    if ([404, 409].includes(error.status)) {
      console.warn(`Allocation ${allocationId} ${result} nahi hua: ${error.message}`);
      return;
    }

    throw error;
  }
};


const processGlobalMessage = async (channel, msg) => {
  const content = JSON.parse(msg.content.toString());
  const { event, buildId, projectId, projectType, allocationId } = content;

  if (!event || !buildId || !projectId) {
    console.warn("Global queue message me event, buildId ya projectId missing hai");
    channel.ack(msg);
    return;
  }

  if (event === "BUILD") {
    if (content.status === buildAndDeployStatusForQueues.build["build-requested"]) {
      const suggestedNode = await suggestNodeService({ nodeType: "build" });

      if (!suggestedNode) {
        sendToRetryQueue(channel, content);
        channel.ack(msg);
        return;
      }

      try {
        await publishToNode("build", suggestedNode.nodeId, {
          ...content,
          ...suggestedNode,
        });
      } catch (error) {
        await releaseAllocation(suggestedNode.allocationId, "failed");
        throw error;
      }

      channel.ack(msg);
      return;
    }

    if (content.status === buildAndDeployStatusForQueues.build["build-completed"]) {
      // build slot ka kaam khatam, ab usko release kar do
      await releaseAllocation(allocationId, "success");

      const buildData = { ...content };
      delete buildData.allocationId;
      delete buildData.nodeId;
      delete buildData.nodeUrl;
      delete buildData.nodeIp;

      const nodeType = projectType === "static" ? "deploy-static" : "deploy-dynamic";
      const suggestedNode = await suggestNodeService({
        ...(content.resources || {}),
        nodeType,
      });

      if (!suggestedNode) {
        sendToRetryQueue(channel, buildData);
        channel.ack(msg);
        return;
      }

      try {
        await publishToNode("deploy", suggestedNode.nodeId, {
          ...buildData,
          ...suggestedNode,
          event: "DEPLOY",
          buildStatus: buildAndDeployStatusForQueues.build["build-completed"],
          status: buildAndDeployStatusForQueues.deploy["deploy-requested"],
        });
      } catch (error) {
        await releaseAllocation(suggestedNode.allocationId, "failed");
        throw error;
      }

      channel.ack(msg);
      return;
    }

    if ([buildAndDeployStatusForQueues.build["build-failed"], buildAndDeployStatusForQueues.build["build-cancelled"], buildAndDeployStatusForQueues.build["build-released"],].includes(content.status)) {
      await releaseAllocation(allocationId, "failed");
    }
  }

  if (event === "DEPLOY") {
    if (content.status === buildAndDeployStatusForQueues.deploy["deploy-completed"]) {
      await releaseAllocation(allocationId, "success");
    } else if ([buildAndDeployStatusForQueues.deploy["deploy-failed"], buildAndDeployStatusForQueues.deploy["deploy-cancelled"], buildAndDeployStatusForQueues.deploy["deploy-released"],].includes(content.status)) {
      await releaseAllocation(allocationId, "failed");
    }
  }

  channel.ack(msg);
};


export const globalBuildDeploySheduler = async () => {
  const channel = getChannel();

  await channel.assertQueue(QUEUE_NAMES.GLOBAL, { durable: true });
  await channel.assertQueue(QUEUE_NAMES.GLOBAL_RETRY, { durable: true });
  await channel.assertQueue(QUEUE_NAMES.GLOBAL_DEAD_LETTER, { durable: true });

  // retry queue se task ko thoda wait kara ke global queue me wapas bhejo
  await channel.consume(QUEUE_NAMES.GLOBAL_RETRY, (msg) => {
    if (!msg) return;

    let content;
    try {
      content = JSON.parse(msg.content.toString());
    } catch (error) {
      console.error("Retry queue ka message read nahi hua:", error.message);
      channel.ack(msg);
      return;
    }

    const retryCount = Number(content.retryCount || 0);
    const delay = Math.min(1000 * (2 ** Math.min(retryCount, 5)), 30000);

    setTimeout(() => {
      channel.sendToQueue(QUEUE_NAMES.GLOBAL, Buffer.from(JSON.stringify(content)),
        { persistent: true, contentType: "application/json" },
      );
      channel.ack(msg);
    }, delay);
  }, { noAck: false });

  await channel.consume(QUEUE_NAMES.GLOBAL, async (msg) => {
    if (!msg) return;

    try {
      await processGlobalMessage(channel, msg);
    } catch (error) {
      console.error("Scheduled task process nahi hua:", error.message);

      try {
        const content = JSON.parse(msg.content.toString());
        sendToRetryQueue(channel, content);
        channel.ack(msg);
      } catch (retryError) {
        console.error("Task retry queue me nahi ja saka:", retryError.message);
        channel.nack(msg, false, true);
      }
    }
  }, { noAck: false });
};
