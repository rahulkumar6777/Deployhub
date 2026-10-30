import amqp from "amqplib";
import { QUEUE_NAMES } from "../../../../../shared/queues/queueNames.js";
import { envs } from "../../lib/env.js";


let connection;
let channel;

export const connectRabbitMQ = async () => {
    connection = await amqp.connect(
        envs.RABBIT_MQ_URL
    );

    channel = await connection.createChannel();

    // global build and deploy task shedular
    await channel.assertQueue(
        QUEUE_NAMES.GLOBAL,
        {
            durable: true,
        }
    );

    // rety
    await channel.assertQueue(
        QUEUE_NAMES.GLOBAL_RETRY,
        {
            durable: true,
        }
    );
};

export const getChannel = () => {
    if (!channel) {
        throw new Error(
            "RabbitMQ channel not initialized"
        );
    }

    return channel;
};


export const ensureNodeQueues = async (nodeId) => {
  const ch = getChannel();
  await ch.assertQueue(QUEUE_NAMES.BUILD_NODE(nodeId), { durable: true });
  await ch.assertQueue(QUEUE_NAMES.DEPLOY_NODE(nodeId), { durable: true });
};


// job daalna
export const publishToNode = async (type, nodeId, payload) => {
  const ch = getChannel();
  const queue =
    type === "build"
      ? QUEUE_NAMES.BUILD_NODE(nodeId)
      : QUEUE_NAMES.DEPLOY_NODE(nodeId);

  await ensureNodeQueues(nodeId);
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });
};

export const closeRabbitMQ = async () => {
    if (channel) {
        await channel.close();
    }

    if (connection) {
        await connection.close();
    }
};