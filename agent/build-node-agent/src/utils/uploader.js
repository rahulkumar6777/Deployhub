import { uplaodFileOnDomainDrop } from '../../../../shared/domaindrop/uploadfile.js';
import { getFileUrlDomainDrop } from '../../../../shared/domaindrop/getfileUrl.js';
import { domainDrop } from '../../../../shared/domaindrop/domaindrop.js';
import { DomainDrop, DomainDropError } from '@domaindrop/node';
import { envs } from '../lib/env.js';
import { domainDropFilesPathKey } from '../../../../shared/domaindrop/filesPathkey.js';

const uploadBuildFile = async ({ filePath, fileName, projectId, mimeType, label, destinationPath }) => {
    if (!filePath || !fileName || !projectId) {
        throw new Error('Build file upload requires filePath, fileName, and projectId');
    }

    try {
        const drop = await domainDrop({ DomainDrop, apiKey: envs.DOMAINDROP_API_KEY });
        const uploadResult = await uplaodFileOnDomainDrop({
            domainDrop: drop,
            DomainDropError,
            file: filePath,
            filename: fileName,
            mimeType,
            spaceId: envs.DOMAINDROP_SPACE_ID,
            label,
            path: destinationPath,
        });

        if (!uploadResult?.id) {
            throw new Error(uploadResult?.message || uploadResult?.error || 'DomainDrop did not return a file ID');
        }

        const fileUrl = await getFileUrlDomainDrop({ domainDrop: drop, fileId: uploadResult.id, DomainDropError });
        if (!fileUrl?.url) throw new Error('DomainDrop did not return a file URL');

        return fileUrl.url;
    } catch (error) {
        console.error(`[buildUploader] ${label} upload failed:`, error.message);
        return null;
    }
};

export const uploadLog = ({ filePath, buildFileName, projectId }) => uploadBuildFile({
    filePath,
    fileName: buildFileName,
    projectId,
    mimeType: 'text/plain',
    label: 'build-log',
    destinationPath: domainDropFilesPathKey.logsFile(projectId, buildFileName),
});

export const uploadBuildArtifact = ({ filePath, buildFileName, projectId }) => uploadBuildFile({
    filePath,
    fileName: buildFileName,
    projectId,
    mimeType: 'application/zip',
    label: 'build-artifact',
    destinationPath: domainDropFilesPathKey.buildArtifact(projectId, buildFileName),
});
