import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';
import { Build } from '../models/build.model.js';

export const startBuildStatusConsumer = async (channel) => {
    await channel.consume(QUEUE_NAMES.BUILD_STATUS_QUEUE, async (msg) => {
        if (!msg) return;

        try {
            const payload = JSON.parse(msg.content.toString());
            const { buildId, status, startedAt, finishedAt, logUrl, artifactUrl, commitSha } = payload;


            if (!buildId) {
                channel.ack(msg);
                return;
            }

            const update = {};

            if (startedAt) update.startedAt = new Date(startedAt);
            if (finishedAt) update.finishedAt = new Date(finishedAt);
            if (status === 'success' || status === 'failed') update.status = status;
            if (logUrl) update.logUrl = logUrl;
            if (artifactUrl) update.artifactUrl = artifactUrl;
            if (commitSha) update.commitSha = commitSha;

            await Build.findByIdAndUpdate(buildId, { $set: update }, { runValidators: true });
            channel.ack(msg);
        } catch (error) {
            console.error('[build-status] Could not process build status:', error.message);


            const requeue = error instanceof SyntaxError ? false : true;
            channel.nack(msg, false, requeue);
        }
    }, { noAck: false });
};
