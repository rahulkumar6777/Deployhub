import amqp from "amqplib";
import { QUEUE_NAMES } from "../../../../../shared/queues/queueNames.js";
import { buildEnv } from "../../lib/env.js";

let connection;
let channel;
let shuttingDown = false;
let reconnectTimer = null;
const onReadyCallbacks = [];


export const onRabbitReady = (cb) => {
    onReadyCallbacks.push(cb);
    if (channel) cb(channel);
};

const scheduleReconnect = () => {
    if (shuttingDown || reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectRabbitMQ();
    }, 5000);
};

export const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(buildEnv.RABBITMQ_URL, { heartbeat: 30 });

        connection.on("error", (err) => {
            console.error("RabbitMQ error:", err.message);
        });

        connection.on("close", () => {
            channel = null;
            if (shuttingDown) return;
            console.error("RabbitMQ closed, reconnecting in 5s...");
            scheduleReconnect();
        });

        channel = await connection.createChannel();

        channel.on("error", (err) => {
            console.error("RabbitMQ channel error:", err.message);
        });

        await channel.assertQueue(QUEUE_NAMES.BUILD_STATUS_QUEUE, { durable: true });

        console.log("RabbitMQ connected");

        for (const cb of onReadyCallbacks) {
            await cb(channel);
        }
    } catch (err) {
        console.error("RabbitMQ connect failed:", err.message);
        channel = null;
        scheduleReconnect();
    }
};

export const getChannel = () => {
    if (!channel) {
        throw new Error("RabbitMQ channel not initialized");
    }
    return channel;
};



export const closeRabbitMQ = async () => {
    shuttingDown = true;
    clearTimeout(reconnectTimer);
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
    } catch (err) {
        console.error("RabbitMQ close error:", err.message);
    }
};