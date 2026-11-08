import { uplaodFileOnDomainDrop } from "../../../../shared/domaindrop/uploadfile.js";
import { getFileUrlDomainDrop } from "../../../../shared/domaindrop/getfileUrl.js";
import { domainDrop } from "../../../../shared/domaindrop/domaindrop.js";
import { DomainDrop, DomainDropError } from "@domaindrop/node";
import { envs } from "../lib/env.js";
import { domainDropFilesPathKey } from "../../../../shared/domaindrop/filesPathkey.js";


export const uploadLog = async ({ buildFileName, projectId }) => {
    try {

        const drop = await domainDrop({ DomainDrop, apiKey: envs.DOMAINDROP_API_KEY });

        const uplaodResult = await uplaodFileOnDomainDrop({
            domainDrop: drop,
            DomainDropError,
            file: file.path,
            filename: file.filename,
            mimeType: file.mimetype,
            userId,
            spaceId: envs.DOMAINDROP_SPACE_ID,
            label: 'profile',
            path: domainDropFilesPathKey.logsFile(projectId, buildFileName)
        });

        const profilePicUrl = await getFileUrlDomainDrop({ domainDrop: drop, fileId: uplaodResult.id, DomainDropError });
        return profilePicUrl.url;

    } catch (error) {
        return null;
    }
}