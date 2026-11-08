import { uplaodFileOnDomainDrop } from "../../../../shared/domaindrop/uploadfile.js";
import { getFileUrlDomainDrop } from "../../../../shared/domaindrop/getfileUrl.js";
import { domainDrop } from "../../../../shared/domaindrop/domaindrop.js";
import { DomainDrop, DomainDropError } from "@domaindrop/node";
import { envs } from "../lib/env.js";
import { domainDropFilesPathKey } from "../../../../shared/domaindrop/filesPathkey.js";


export const uploadLog = async ({ filePath, buildFileName, projectId }) => {
    if (!filePath || !buildFileName || !projectId) {
        throw new Error('uploadLog requires filePath, buildFileName, and projectId');
    }

    try {
        const drop = await domainDrop({ DomainDrop, apiKey: envs.DOMAINDROP_API_KEY });

        const uploadResult = await uplaodFileOnDomainDrop({
            domainDrop: drop,
            DomainDropError,
            file: filePath,
            filename: buildFileName,
            mimeType: 'text/plain',
            spaceId: envs.DOMAINDROP_SPACE_ID,
            label: 'build-log',
            path: domainDropFilesPathKey.logsFile(projectId, buildFileName)
        });

        if (!uploadResult?.id) {
            throw new Error(uploadResult?.message || uploadResult?.error || 'DomainDrop did not return a log file ID');
        }

        const fileUrl = await getFileUrlDomainDrop({ domainDrop: drop, fileId: uploadResult.id, DomainDropError });
        if (!fileUrl?.url) throw new Error('DomainDrop did not return a log URL');

        return fileUrl.url;

    } catch (error) {
        console.error('[buildLogger] Log upload failed:', error.message);
        return null;
    }
}
