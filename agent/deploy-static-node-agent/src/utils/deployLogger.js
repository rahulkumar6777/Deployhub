import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getRedis } from '../config/redis.js';

const stripAnsi = (value) => value.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');

const ignorePatterns = [
    /^Step \d+\//,
    /^ ---> /,
    /^Successfully built/,
    /^Successfully tagged/,
    /^Removing intermediate container/,
    /^npm notice/,
    /^npm fund/,
    /^\s*$/,
];

export class DeployLogger {
    constructor(deployId, projectId, { logDirectory = process.env.DEPLOY_LOG_DIR } = {}) {
        if (!deployId) throw new Error('DeployLogger requires a deployId');

        this.deployId = String(deployId);
        this.projectId = projectId == null ? '' : String(projectId);
        this.logDirectory = path.resolve(logDirectory || path.join(process.cwd(), 'deploy-logs'));
        this.lines = [];
        this.pending = '';
        this.startedAt = null;
        this.finished = false;
        this.streamKey = `deployhub:users:deploy:logs:${this.deployId}`;
        this.logFilePath = path.join(this.logDirectory, `${this.deployId}.logs`);
    }

    async start() {
        if (this.startedAt) return;

        this.startedAt = new Date();
        await mkdir(this.logDirectory, { recursive: true });
        await writeFile(this.logFilePath, '', 'utf8');
        await this.write('Deployment started\n');
    }

    async write(chunk) {
        if (chunk == null || this.finished) return;

        const text = this.pending + stripAnsi(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk));
        const normalized = text.replace(/\r/g, '\n').replace(/^[\x00-\x08][\x00-\x03][\x00]{6}/gm, '');
        const lines = normalized.split('\n');
        this.pending = lines.pop() ?? '';

        for (const rawLine of lines) {
            await this.#writeLine(rawLine);
        }
    }

    async writeLine(line) {
        if (this.pending.trim()) {
            await this.#writeLine(this.pending);
            this.pending = '';
        }
        await this.#writeLine(String(line ?? ''));
    }

    async #writeLine(rawLine) {
        const line = rawLine.trimEnd();
        if (!line.trim() || ignorePatterns.some((pattern) => pattern.test(line))) return;

        const formatted = `[deployhub] ${line}`;
        this.lines.push(formatted);

        try {
            const redis = getRedis();
            await redis.xadd(
                this.streamKey, '*',
                'projectId', this.projectId,
                'deployId', this.deployId,
                'log', formatted,
                'createdAt', String(Date.now()),
            );
            await redis.expire(this.streamKey, 60 * 60 * 24);
        } catch (error) {
            if (!this.redisWarningLogged) {
                console.warn(`[deployLogger] Live Redis logging unavailable: ${error.message}`);
                this.redisWarningLogged = true;
            }
        }
    }

    async finish(status = 'success') {
        if (this.finished) {
            return this.#result(status);
        }

        if (!this.startedAt) await this.start();
        if (this.pending.trim()) {
            await this.#writeLine(this.pending);
            this.pending = '';
        }

        this.lines.push(`[deployhub] Deployment finished (${status})`);
        await mkdir(this.logDirectory, { recursive: true });
        await writeFile(this.logFilePath, `${this.lines.join('\n')}\n`, 'utf8');
        this.finished = true;

        try {
            const redis = getRedis();
            await redis.xadd(
                this.streamKey, '*',
                'type', 'complete',
                'status', String(status),
                'deployId', this.deployId,
                'projectId', this.projectId,
                'logFile', this.logFilePath,
                'createdAt', String(Date.now()),
            );
            await redis.expire(this.streamKey, 60 * 60 * 24);
        } catch (error) {
            if (!this.redisWarningLogged) {
                console.warn(`[deployLogger] Could not publish log completion: ${error.message}`);
                this.redisWarningLogged = true;
            }
        }

        return this.#result(status);
    }

    #result(status) {
        return {
            deployId: this.deployId,
            projectId: this.projectId,
            status,
            logFilePath: this.logFilePath,
            fileName: path.basename(this.logFilePath),
            logs: this.lines.join('\n'),
        };
    }
}
