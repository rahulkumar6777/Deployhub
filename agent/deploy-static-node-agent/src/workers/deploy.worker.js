import Docker from 'dockerode';
import { getChannel } from '../config/rabbitmq.js'
import { getRedis } from '../config/redis.js';
import { envs } from '../lib/env.js';
import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';


export const globalDeployShedular = async () => {

    const channel = getChannel();
    const redis = getRedis();

    const docker = new Docker();

    // ye docker ka credentials hai
    const dockerUsername = envs.DOCKER_USERNAME;
    const dockerPassword = envs.DOCKER_PASSWORD;

    await channel.consume(QUEUE_NAMES.DEPLOY_NODE(process.env.NODE_ID), async (msg) => {
        if (!msg) return;

        try {

        } catch (error) {

        } finally {

        }

    })

};