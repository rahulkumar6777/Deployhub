import { buildAndDeployStatusForQueues } from "../../../../shared/constants/buildanddeploystatusforqueues.js";
import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { fetchCommitSha } from "../../../../shared/utils/fetchCommitSha.js";
import { getUserGithubAccessToken } from "../../../../shared/utils/getUserGIthubAccesstoken.js";
import { publishProjectStatus } from "../../../../shared/utils/publishProjectStatus.js";
import { getChannel } from "../config/rabbitmq.js";
import { getRedis } from "../config/redis.js";
import { envs } from "../lib/env.js";
import axios from 'axios';
import path from "path";
import { typeLangVersionSelector } from "../utils/languageVersion.js";
import { generateDockerfile } from "../../../../shared/docker/generateDockerfile.js";
import { checkAndPullImage } from "../../../../shared/docker/checkAndPullImage.js";
import Docker from "dockerode";
import { GitCloner } from "../../../../shared/git/gitrepoCloner.js";
import fs from 'fs';
import tar from "tar-fs";
import { dockerProgress } from "../../../../shared/docker/dockerProgress.js";
import { buildDockerImage } from "../../../../shared/docker/buildImage.js";
import * as maintar from 'tar';
import { pushDockerImage } from "../../../../shared/docker/pushImage.js";
import { BuildLogger } from "../utils/buildLogger.js";
import { uploadBuildArtifact, uploadLog } from "../utils/uploader.js";
import { createZip } from "../utils/createZip.js";

const removeBuildDirectory = async (directoryPath) => {
    await fs.promises.rm(directoryPath, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 500,
    });
};


export const globalBuildSheduler = async () => {

    const channel = getChannel();
    const redis = getRedis();

    const docker = new Docker()

    // ye base repo folder path hai
    const baserepopath = path.resolve('builds');


    // ye docker ka credentials hai
    const dockerUsername = envs.DOCKER_USERNAME;
    const dockerPassword = envs.DOCKER_PASSWORD;


    await channel.consume(QUEUE_NAMES.BUILD_NODE(process.env.NODE_ID), async (msg) => {
        if (!msg) return;

        // here some univesal variables
        let projectData;
        let userGithubAcessToken;

        let imageName;

        // ye buildfilepath ka pura folder path hai
        let buildFilePath;

        let startedAt;
        let finishedAt;
        let logger;
        let buildId;
        let projectId;
        let content = {};
        let commitSha;
        let logsUrl = null;
        let artifactUrl = null;
        let buildStatus = 'failed';

        try {
            content = JSON.parse(msg.content.toString());
            ({ buildId, projectId } = content);
            const { event, userId, projectName, firstTime, status, projectType, allocationId } = content;

            logger = new BuildLogger(buildId, projectId);
            await logger.start();
            startedAt = new Date();


            try {
                await publishProjectStatus(redis, { projectId, status: 'building' });
            } catch (redisError) {
                console.warn('[build-worker] Could not publish building status to Redis:', redisError.message);
            }
            await channel.sendToQueue(
                QUEUE_NAMES.PROJECT_STATUS_UPDATE_QUEUE,
                Buffer.from(JSON.stringify({ projectId, status: 'building' })),
                { persistent: true, contentType: 'application/json' },
            );
            await channel.sendToQueue(
                QUEUE_NAMES.BUILD_STATUS_QUEUE,
                Buffer.from(JSON.stringify({ buildId, projectId, status: 'building', startedAt })),
                { persistent: true, contentType: 'application/json' },
            );

            // here i make docker image name
            imageName = `${dockerUsername}/${projectId.toString().toLowerCase()}:${buildId.toString().toLowerCase()}`;

            // base repo path
            if (!fs.existsSync(baserepopath)) {
                fs.mkdirSync(baserepopath, { recursive: true });
            }

            if (event === "BUILD") {
                if (status === buildAndDeployStatusForQueues.build["build-requested"]) {


                    const rawData = await axios.get(`${envs.PROJECT_SERVICE_URL}/internal/project/${projectId}`, {
                        headers: {
                            "Content-Type": "application/json",
                            "x-internal-secret": envs.INTERNAL_SECRET,
                            "x-microservice-secret": envs.INTERNAL_SERVICE_TALKING_SECRET,
                        }
                    });

                    projectData = rawData.data.projectData;
                    await logger.writeLine(`Project loaded: ${projectData.name || projectId}`);

                    userGithubAcessToken = await getUserGithubAccessToken(axios, envs.IDENTITY_SERVICE_URL, userId, envs.INTERNAL_SERVICE_TALKING_SECRET, envs.INTERNAL_SECRET)

                    // here fetch commitsha
                    commitSha = await fetchCommitSha(projectData.repoUrl, projectData.branch, userGithubAcessToken);

                    // build filepath
                    buildFilePath = path.resolve(baserepopath, String(buildId));

                    const relativeBuildPath = path.relative(baserepopath, buildFilePath);
                    if (
                        !relativeBuildPath ||
                        relativeBuildPath === '..' ||
                        relativeBuildPath.startsWith(`..${path.sep}`) ||
                        path.isAbsolute(relativeBuildPath)
                    ) {
                        throw new Error('Invalid build path');
                    }

                    // Retries can reuse a buildId whose previous workspace was left behind.
                    await removeBuildDirectory(buildFilePath);

                    let dynamicBuildArgs = {};

                    if (projectData.type === 'static') {
                        let viteEnvContent = '';

                        for (const envVar of projectData.env || []) {
                            viteEnvContent += `${envVar.key}=${envVar.encryptedValue}\n`;
                        }

                        dynamicBuildArgs.VITE_ENV_CONTENT = viteEnvContent;
                    }

                    const lanVersion = typeLangVersionSelector(projectData.type, projectData.version);

                    await logger.writeLine(`cloning repo ${projectData.repoUrl}`);

                    try {
                        await GitCloner.clone({ repoUrl: projectData.repoUrl, branch: projectData.branch, targetPath: buildFilePath, githubToken: userGithubAcessToken, folderName: projectData.rootDirectory })

                    } catch (error) {
                        switch (error.code) {
                            case "BRANCH_NOT_FOUND":
                                await logger.writeLine(error.message);
                                break;

                            case "REPO_NOT_FOUND":
                                await logger.writeLine(error.message);
                                break;

                            case "AUTH_FAILED":
                                await logger.writeLine(error.message);
                                break;

                            default:
                                await logger.writeLine(`Failed to clone repository`);
                        }
                        throw error
                    }
                    await logger.writeLine(`repo cloned successfully`);

                    // yeha pe docker file likha ja raha hai , based on proejct type
                    const dockerfileContent =
                        generateDockerfile({
                            projectType: projectData.type,
                            version: projectData.version,
                            buildCommand: projectData.buildCommand,
                            startCommand: projectData.startCommand
                        });

                    // and yeha pe jo buildfilepath hai uske dockerfike copy ho raha hai
                    await fs.writeFileSync(
                        path.join(buildFilePath, "Dockerfile"),
                        dockerfileContent
                    );

                    await logger.writeLine(`pulling base image ${lanVersion}`)

                    await checkAndPullImage(docker, lanVersion)

                    await logger.writeLine(`base image ready`)

                    const buildContext = tar.pack(buildFilePath);

                    const stream = await buildDockerImage({
                        docker,
                        buildContext,
                        imageName,
                        dockerFile: "Dockerfile",
                        buildArgs: dynamicBuildArgs
                    });

                    await dockerProgress(
                        docker,
                        stream,
                        logger
                    )

                    if (projectData.type === 'static') {

                        await logger.writeLine('spinning up container');

                        const container = await docker.createContainer({
                            Image: imageName
                        });

                        let archiveStream;
                        try {
                            archiveStream = await container.getArchive({
                                path: `/app/${projectData.publishDir}`
                            })
                        } catch (error) {
                            await logger.writeLine(`invalid PublishDir! ${projectData.publishDir}, "please check your Settings`);
                            throw error;
                        }

                        const tarFile = path.join(
                            buildFilePath,
                            'artifact.tar'
                        );

                        await new Promise((resolve, reject) => {

                            const writeStream = fs.createWriteStream(tarFile);

                            archiveStream.pipe(writeStream);

                            writeStream.on('finish', resolve);
                            writeStream.on('error', reject);
                        });

                        const extractedDir = path.join(
                            buildFilePath,
                            'publish'
                        );

                        fs.mkdirSync(
                            extractedDir,
                            { recursive: true }
                        );

                        await maintar.extract({
                            file: tarFile,
                            cwd: extractedDir
                        });

                        await logger.writeLine('creating zip archive')

                        const zipPath = path.join(
                            buildFilePath,
                            'build.zip'
                        );

                        await createZip(
                            path.join(
                                extractedDir,
                                projectData.publishDir
                            ),
                            zipPath
                        );

                        await logger.writeLine('zip created')

                        await container.remove({
                            force: true
                        });

                        await logger.writeLine('cleaning up container');

                        await docker.getImage(imageName).remove({
                            force: true
                        });

                        artifactUrl = await uploadBuildArtifact({
                            filePath: zipPath,
                            buildFileName: `${buildId}.zip`,
                            projectId,
                        });
                        if (!artifactUrl) {
                            throw new Error('Static build ZIP could not be uploaded to DomainDrop');
                        }

                        await logger.writeLine('static build ZIP uploaded to DomainDrop');

                    } else {

                        const pushStream = await pushDockerImage({
                            docker,
                            imageName,
                            username: dockerUsername,
                            password: dockerPassword
                        });

                        await dockerProgress(
                            docker,
                            pushStream,
                            logger
                        );
                    }

                    buildStatus = 'success';

                }
            }



        } catch (err) {
            if (logger) {
                await logger.writeLine(`[ERROR] ${err.message}`);
            }
            console.error("Error processing message:", err);
        } finally {
            finishedAt = new Date();

            if (logger) {
                try {
                    const logArtifact = await logger.finish(buildStatus);
                    logsUrl = await uploadLog({
                        filePath: logArtifact.logFilePath,
                        buildFileName: logArtifact.fileName,
                        projectId: logArtifact.projectId,
                    });

                    if (logsUrl) {
                        console.info(`[build-worker] Build ${logArtifact.buildId} logs uploaded: ${logsUrl}`);
                    } else {
                        console.warn(`[build-worker] Build ${logArtifact.buildId} logs saved locally, but upload did not return a URL.`);
                    }
                } catch (logError) {
                    console.error('[build-worker] Could not finalize build logs:', logError);
                }
            }

            if (buildId && projectId) {

                const terminalStatus = buildStatus === 'success' ? buildAndDeployStatusForQueues.build['build-completed'] : buildAndDeployStatusForQueues.build['build-failed'];
                const projectStatus = buildStatus === 'success' ? 'deploying' : 'build-failed';

                const statusPayload = {
                    event: 'BUILD',
                    buildId,
                    projectId,
                    userId: content.userId,
                    projectName: content.projectName,
                    projectType: content.projectType || projectData?.type,
                    firstTime: content.firstTime === true,
                    allocationId: content.allocationId,
                    commitSha,
                    startedAt,
                    finishedAt,
                    status: buildStatus,
                    projectStatus,
                    logUrl: logsUrl,
                    artifactUrl,
                    dockerImage: projectData?.type === 'static' ? null : imageName
                };

                try {
                    try {
                        await publishProjectStatus(redis, { projectId, status: projectStatus });
                    } catch (redisError) {
                        console.warn('[build-worker] Could not publish terminal status to Redis:', redisError.message);
                    }

                    await channel.sendToQueue(QUEUE_NAMES.BUILD_STATUS_QUEUE, Buffer.from(JSON.stringify(statusPayload)),
                        { persistent: true, contentType: 'application/json' },
                    );

                    await channel.sendToQueue(QUEUE_NAMES.PROJECT_STATUS_UPDATE_QUEUE, Buffer.from(JSON.stringify({ projectId, status: projectStatus })),
                        { persistent: true, contentType: 'application/json' },
                    );

                    await channel.sendToQueue(QUEUE_NAMES.GLOBAL, Buffer.from(JSON.stringify({ ...statusPayload, status: terminalStatus })),
                        { persistent: true, contentType: 'application/json' },
                    );

                    channel.ack(msg);
                } catch (statusError) {
                    console.error('[build-worker] Could not publish terminal build status:', statusError);
                    channel.nack(msg, false, true);
                }
            } else {
                // Invalid messages cannot be retried usefully without build IDs.
                channel.ack(msg);
            }

            if (
                buildFilePath &&
                fs.existsSync(buildFilePath)
            ) {
                try {
                    await removeBuildDirectory(buildFilePath);
                } catch (cleanupError) {
                    console.error('[build-worker] Could not clean build directory:', cleanupError.message);
                }
            }
        }
    });
}
