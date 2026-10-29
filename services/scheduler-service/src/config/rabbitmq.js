import amqp from "amqplib";
import { envs } from "../lib/env.js";
import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";

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
};

export const getChannel = () => {
    if (!channel) {
        throw new Error(
            "RabbitMQ channel not initialized"
        );
    }

    return channel;
};

export const closeRabbitMQ = async () => {
    if (channel) {
        await channel.close();
    }

    if (connection) {
        await connection.close();
    }
};