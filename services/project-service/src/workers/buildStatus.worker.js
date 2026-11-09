import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';
import { Project, Project_Status } from '../models/project.model.js';

export const startProjectStatusConsumer = async (channel) => {
    await channel.consume(QUEUE_NAMES.PROJECT_STATUS_UPDATE_QUEUE, async (msg) => {
        if (!msg) return;

        try {
            const payload = JSON.parse(msg.content.toString());
            const { projectId, status } = payload;

            if (!projectId) {
                channel.ack(msg);
                return;
            }

            if (!Project_Status.includes(status)) {
                console.warn(`[project-status] Ignoring unsupported project status: ${status}`);
                channel.ack(msg);
                return;
            }

            await Project.findByIdAndUpdate(
                projectId,
                { $set: { status } },
                { runValidators: true },
            );
            channel.ack(msg);
        } catch (error) {
            console.error('[project-status] Could not process project status:', error.message);
            const requeue = error instanceof SyntaxError ? false : true;
            channel.nack(msg, false, requeue);
        }
    }, { noAck: false });
};
