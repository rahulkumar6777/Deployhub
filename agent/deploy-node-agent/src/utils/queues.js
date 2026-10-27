import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';
import { envs } from '../lib/env.js';

const connection = {
    host: envs.REDIS_HOST,
    port: Number(envs.REDIS_PORT),
    password: envs.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
};

export const deployQueue = new Queue(QUEUE_NAMES.DEPLOY_NODE(process.env.NODE_ID), { connection });
